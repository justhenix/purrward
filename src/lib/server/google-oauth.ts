// SECURITY: Google OAuth callback core with injectable side effects for tests.
import { eq } from 'drizzle-orm';
import { createSessionCookie, generateSessionId } from './auth';
import { sessions, users } from './db/schema';

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
	name?: string;
	picture?: string;
};

export function authFailure(): Response {
	return new Response('Authentication failed.', { status: 400 });
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
	if (!profile.sub || !profile.email) return authFailure();

	const now = Date.now();
	const existing = await input.database
		.select()
		.from(users)
		.where(eq(users.googleSub, profile.sub))
		.limit(1);
	const userId = existing[0]?.id ?? crypto.randomUUID();
	const userValues = {
		id: userId,
		googleSub: profile.sub,
		email: profile.email,
		displayName: profile.name ?? null,
		avatarUrl: profile.picture ?? null,
		createdAt: existing[0]?.createdAt ?? now
	};

	if (existing[0]) {
		await input.database
			.update(users)
			.set({
				email: userValues.email,
				displayName: userValues.displayName,
				avatarUrl: userValues.avatarUrl
			})
			.where(eq(users.id, userId));
	} else {
		await input.database.insert(users).values(userValues);
	}

	// SECURITY: new login invalidates prior sessions for this user.
	await input.database.delete(sessions).where(eq(sessions.userId, userId));

	const sessionId = generateSessionId();
	await input.database.insert(sessions).values({
		id: sessionId,
		userId,
		googleSub: profile.sub,
		email: profile.email,
		displayName: profile.name ?? null,
		avatarUrl: profile.picture ?? null,
		createdAt: now,
		expiresAt: now + 7 * 24 * 60 * 60 * 1000
	});

	const headers = new Headers({ Location: '/' });
	headers.append('Set-Cookie', createSessionCookie(sessionId, input.secureCookie));
	headers.append(
		'Set-Cookie',
		[
			'oauth_state=',
			'HttpOnly',
			input.secureCookie ? 'Secure' : '',
			'SameSite=Strict',
			'Path=/auth',
			'Max-Age=0',
			'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
		]
			.filter(Boolean)
			.join('; ')
	);
	return new Response(null, { status: 302, headers });
}
