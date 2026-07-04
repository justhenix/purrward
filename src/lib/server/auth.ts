// SECURITY: session validation, cookie management, auth utilities
// All auth state server-side only. Never expose tokens to client.

import { eq } from 'drizzle-orm';
import { sessions, users } from './db/schema';
import type { Cookies } from '@sveltejs/kit';

type Database = typeof import('./db').db;
type AuthMethod = 'google' | 'email';

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export type SessionValidation = {
	user: NonNullable<App.Locals['user']>;
	session: NonNullable<App.Locals['session']>;
};

async function getDb(): Promise<Database> {
	return (await import('./db')).db;
}

export function generateSessionId(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createSessionCookie(sessionId: string, secure = true): string {
	// SECURITY: HttpOnly, Secure, SameSite=Strict
	return [
		`session=${sessionId}`,
		'HttpOnly',
		secure ? 'Secure' : '',
		'SameSite=Strict',
		'Path=/',
		`Max-Age=${SESSION_MAX_AGE_SECONDS}`
	]
		.filter(Boolean)
		.join('; ');
}

export function clearSessionCookie(secure = true): string {
	return [
		'session=',
		'HttpOnly',
		secure ? 'Secure' : '',
		'SameSite=Strict',
		'Path=/',
		'Max-Age=0',
		'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
	]
		.filter(Boolean)
		.join('; ');
}

export function setSessionCookie(cookies: Cookies, sessionId: string, secure = true): void {
	// SECURITY: HttpOnly, Secure, SameSite=Strict cookie set via SvelteKit API.
	cookies.set('session', sessionId, {
		httpOnly: true,
		secure,
		sameSite: 'strict',
		path: '/',
		maxAge: SESSION_MAX_AGE_SECONDS
	});
}

export function deleteSessionCookie(cookies: Cookies, secure = true): void {
	cookies.delete('session', {
		httpOnly: true,
		secure,
		sameSite: 'strict',
		path: '/'
	});
}

export function shouldUseSecureCookie(url: URL): boolean {
	const host = url.hostname.toLowerCase();
	return url.protocol === 'https:' || (host !== 'localhost' && host !== '127.0.0.1');
}

export function normalizeEmail(value: string): string | null {
	const email = value.trim().toLowerCase();
	if (email.length < 3 || email.length > 254) return null;
	if (!/^[^\s@]{1,64}@[^\s@]{1,253}$/.test(email)) return null;
	const [, domain] = email.split('@');
	if (!domain?.includes('.')) return null;
	return email;
}

export async function createSession(input: {
	database: Database;
	userId: string;
	googleSub: string | null;
	email: string;
	displayName: string | null;
	avatarUrl: string | null;
	authMethod: AuthMethod;
	now?: number;
}): Promise<string> {
	const now = input.now ?? Date.now();
	// SECURITY: a fresh login invalidates prior sessions for this user.
	await input.database.delete(sessions).where(eq(sessions.userId, input.userId));

	const sessionId = generateSessionId();
	await input.database.insert(sessions).values({
		id: sessionId,
		userId: input.userId,
		googleSub: input.googleSub,
		email: input.email,
		authMethod: input.authMethod,
		displayName: input.displayName,
		avatarUrl: input.avatarUrl,
		createdAt: now,
		expiresAt: now + SESSION_MAX_AGE_MS
	});

	return sessionId;
}

export async function validateSession(
	sessionId: string,
	database?: Database
): Promise<SessionValidation | null> {
	const activeDb = database ?? (await getDb());
	const rows = await activeDb
		.select({
			sessionId: sessions.id,
			userId: sessions.userId,
			googleSub: sessions.googleSub,
			email: sessions.email,
			authMethod: sessions.authMethod,
			expiresAt: sessions.expiresAt,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
			purrpoints: users.purrpoints
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	if (row.expiresAt <= Date.now()) {
		// SECURITY: expired tokens are invalidated server-side.
		await activeDb.delete(sessions).where(eq(sessions.id, sessionId));
		return null;
	}

	return {
		user: {
			id: row.userId,
			googleSub: row.googleSub,
			email: row.email,
			displayName: row.displayName,
			avatarUrl: row.avatarUrl,
			purrpoints: row.purrpoints ?? 0
		},
		session: {
			id: row.sessionId,
			userId: row.userId,
			googleSub: row.googleSub,
			email: row.email,
			authMethod: row.authMethod as AuthMethod,
			expiresAt: row.expiresAt
		}
	};
}
