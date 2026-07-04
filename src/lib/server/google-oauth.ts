// SECURITY: Google OAuth callback core with injectable side effects for tests.
import { eq } from 'drizzle-orm';
import { createSession, createSessionCookie, normalizeEmail } from './auth';
import { users } from './db/schema';

type Database = typeof import('./db').db;
type Fetcher = typeof fetch;

export type GoogleOAuthConfig = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
};

type GoogleTokenResponse = {
	access_token?: string;
};

type GoogleUserInfo = {
	sub?: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	picture?: string;
};

export function authFailure(): Response {
	return new Response('Authentication failed.', { status: 400 });
}

export function createOAuthStateCookie(state: string, secureCookie: boolean): string {
	return [
		`oauth_state=${state}`,
		'HttpOnly',
		secureCookie ? 'Secure' : '',
		// SECURITY: Lax lets the state cookie survive Google's cross-site top-level redirect.
		'SameSite=Lax',
		'Path=/auth',
		'Max-Age=600'
	]
		.filter(Boolean)
		.join('; ');
}

export function clearOAuthStateCookie(secureCookie: boolean): string {
	return [
		'oauth_state=',
		'HttpOnly',
		secureCookie ? 'Secure' : '',
		'SameSite=Lax',
		'Path=/auth',
		'Max-Age=0',
		'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
	]
		.filter(Boolean)
		.join('; ');
}

export function getOAuthStartRedirect(
	requestUrl: URL,
	configuredRedirectUri: string
): string | null {
	const redirectUri = new URL(configuredRedirectUri);
	if (requestUrl.origin === redirectUri.origin) return null;

	const canonicalStart = new URL('/auth/google', redirectUri.origin);
	canonicalStart.search = requestUrl.search;
	return canonicalStart.toString();
}

export async function handleGoogleCallback(input: {
	code: string;
	fetcher: Fetcher;
	database: Database;
	config: GoogleOAuthConfig;
	secureCookie: boolean;
}): Promise<Response> {
	const tokenResponse = await input.fetcher('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code: input.code,
			client_id: input.config.clientId,
			client_secret: input.config.clientSecret,
			redirect_uri: input.config.redirectUri,
			grant_type: 'authorization_code'
		})
	});
	if (!tokenResponse.ok) return authFailure();

	const token = (await tokenResponse.json()) as GoogleTokenResponse;
	if (!token.access_token) return authFailure();

	const userResponse = await input.fetcher('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: { Authorization: `Bearer ${token.access_token}` }
	});
	if (!userResponse.ok) return authFailure();

	const profile = (await userResponse.json()) as GoogleUserInfo;
	const email = profile.email ? normalizeEmail(profile.email) : null;
	if (!profile.sub || !email || profile.email_verified !== true) return authFailure();

	const now = Date.now();
	const existingByGoogle = await input.database
		.select()
		.from(users)
		.where(eq(users.googleSub, profile.sub))
		.limit(1);
	const existingByEmail = existingByGoogle[0]
		? []
		: await input.database.select().from(users).where(eq(users.email, email)).limit(1);
	const existing = existingByGoogle[0] ?? existingByEmail[0] ?? null;
	if (existing?.googleSub && existing.googleSub !== profile.sub) return authFailure();

	const userId = existing?.id ?? crypto.randomUUID();
	const userValues = {
		id: userId,
		googleSub: profile.sub,
		email,
		displayName: profile.name ?? null,
		avatarUrl: profile.picture ?? null,
		createdAt: existing?.createdAt ?? now
	};

	if (existing) {
		await input.database
			.update(users)
			.set({
				googleSub: userValues.googleSub,
				email: userValues.email,
				displayName: userValues.displayName,
				avatarUrl: userValues.avatarUrl
			})
			.where(eq(users.id, userId));
	} else {
		await input.database.insert(users).values(userValues);
	}

	const sessionId = await createSession({
		database: input.database,
		userId,
		googleSub: profile.sub,
		email,
		authMethod: 'google',
		displayName: profile.name ?? null,
		avatarUrl: profile.picture ?? null,
		now
	});

	const headers = new Headers({ Location: '/' });
	headers.append('Set-Cookie', createSessionCookie(sessionId, input.secureCookie));
	headers.append('Set-Cookie', clearOAuthStateCookie(input.secureCookie));
	return new Response(null, { status: 302, headers });
}
