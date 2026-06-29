// SECURITY: session validation, cookie management, auth utilities
// All auth state server-side only. Never expose tokens to client.

import { eq } from 'drizzle-orm';
import { sessions, users } from './db/schema';

type Database = typeof import('./db').db;

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
		'Max-Age=604800'
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

export function shouldUseSecureCookie(url: URL): boolean {
	const host = url.hostname.toLowerCase();
	return url.protocol === 'https:' || (host !== 'localhost' && host !== '127.0.0.1');
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
			expiresAt: row.expiresAt
		}
	};
}
