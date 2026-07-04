import { describe, expect, it } from 'vitest';
import {
	clearSessionCookie,
	createSessionCookie,
	generateSessionId,
	shouldUseSecureCookie,
	validateSession
} from './auth';

describe('auth cookie helpers', () => {
	it('sets strict session cookie flags', () => {
		expect(createSessionCookie('abc')).toBe(
			'session=abc; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800'
		);
	});

	it('clears the session cookie', () => {
		expect(clearSessionCookie()).toContain('session=; HttpOnly; Secure; SameSite=Strict; Path=/');
		expect(clearSessionCookie()).toContain('Max-Age=0');
	});

	it('generates a 32-byte hex session id', () => {
		expect(generateSessionId()).toMatch(/^[a-f0-9]{64}$/);
	});

	it('allows insecure cookies only on local development hosts', () => {
		expect(shouldUseSecureCookie(new URL('http://localhost:5173'))).toBe(false);
		expect(shouldUseSecureCookie(new URL('https://localhost:5173'))).toBe(true);
		expect(shouldUseSecureCookie(new URL('http://purrward.pages.dev'))).toBe(true);
	});
});

describe('validateSession', () => {
	it('returns null for missing session', async () => {
		const database = {
			select: () => ({
				from: () => ({
					innerJoin: () => ({
						where: () => ({
							limit: async () => []
						})
					})
				})
			})
		} as unknown as NonNullable<Parameters<typeof validateSession>[1]>;

		await expect(validateSession('missing', database)).resolves.toBeNull();
	});

	it('deletes expired sessions', async () => {
		let deleted = false;
		const database = {
			select: () => ({
				from: () => ({
					innerJoin: () => ({
						where: () => ({
							limit: async () => [
								{
									sessionId: 'expired',
									userId: 'user-1',
									googleSub: 'google-1',
									email: 'cat@example.com',
									authMethod: 'google',
									expiresAt: Date.now() - 1,
									displayName: null,
									avatarUrl: null,
									purrpoints: 0
								}
							]
						})
					})
				})
			}),
			delete: () => ({
				where: async () => {
					deleted = true;
				}
			})
		} as unknown as NonNullable<Parameters<typeof validateSession>[1]>;

		await expect(validateSession('expired', database)).resolves.toBeNull();
		expect(deleted).toBe(true);
	});
});
