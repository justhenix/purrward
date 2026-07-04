import { describe, expect, it } from 'vitest';
import {
	canShowDevResetLink,
	readEmail,
	readPassword,
	registerEmailUser,
	requestPasswordReset,
	resetPasswordWithToken
} from './email-auth';

type Database = Parameters<typeof registerEmailUser>[0]['database'];

function form(values: Record<string, string>): FormData {
	const formData = new FormData();
	for (const [key, value] of Object.entries(values)) formData.set(key, value);
	return formData;
}

function createDatabase(selects: unknown[][] = []) {
	const inserts: unknown[] = [];
	const updates: unknown[] = [];
	let deletes = 0;

	const database = {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: async () => selects.shift() ?? []
				})
			})
		}),
		insert: () => ({
			values: async (value: unknown) => {
				inserts.push(value);
			}
		}),
		update: () => ({
			set: (value: unknown) => ({
				where: async () => {
					updates.push(value);
				}
			})
		}),
		delete: () => ({
			where: async () => {
				deletes += 1;
			}
		})
	} as unknown as Database;

	return {
		database,
		inserts,
		updates,
		get deletes() {
			return deletes;
		}
	};
}

describe('email auth validation', () => {
	it('normalizes email and enforces password length', () => {
		expect(readEmail(form({ email: ' CAT@Example.COM ' }))).toBe('cat@example.com');
		expect(readEmail(form({ email: 'bad-email' }))).toBeNull();
		expect(readPassword(form({ password: 'short' }))).toBeNull();
		expect(readPassword(form({ password: 'long-enough' }))).toBe('long-enough');
	});

	it('shows dev reset links only on local opt-in', () => {
		expect(canShowDevResetLink(new URL('http://localhost:5173/auth/forgot'), 'true')).toBe(true);
		expect(canShowDevResetLink(new URL('https://purrward.pages.dev/auth/forgot'), 'true')).toBe(
			false
		);
		expect(canShowDevResetLink(new URL('http://localhost:5173/auth/forgot'), undefined)).toBe(
			false
		);
	});
});

describe('email auth credentials', () => {
	it('stores password credentials as hash and salt', async () => {
		const db = createDatabase([[]]);
		const result = await registerEmailUser({
			database: db.database,
			email: 'cat@example.com',
			password: 'long-enough',
			now: 1000
		});

		const credential = db.inserts[1] as Record<string, unknown>;
		expect(result?.sessionId).toMatch(/^[a-f0-9]{64}$/);
		expect(credential.passwordHash).not.toBe('long-enough');
		expect(credential.passwordSalt).toEqual(expect.any(String));
		expect(credential.iterations).toBeGreaterThan(100_000);
	});

	it('stores reset token hashes and consumes reset into a fresh session', async () => {
		const user = {
			id: 'user-1',
			googleSub: null,
			email: 'cat@example.com',
			displayName: 'Cat Parent',
			avatarUrl: null
		};
		const resetDb = createDatabase([[user], [{ userId: 'user-1' }]]);
		const reset = await requestPasswordReset({
			database: resetDb.database,
			email: 'cat@example.com',
			now: 1000
		});
		const tokenRow = resetDb.inserts[0] as Record<string, unknown>;

		expect(reset?.token).toMatch(/^[A-Za-z0-9_-]{32,128}$/);
		expect(tokenRow.tokenHash).not.toBe(reset?.token);
		expect(tokenRow.expiresAt).toBeGreaterThan(1000);

		const consumeDb = createDatabase([[tokenRow], [user]]);
		const result = await resetPasswordWithToken({
			database: consumeDb.database,
			token: reset?.token ?? '',
			password: 'new-long-enough',
			now: 2000
		});

		expect(result?.sessionId).toMatch(/^[a-f0-9]{64}$/);
		expect(consumeDb.updates[0]).toMatchObject({ updatedAt: 2000 });
		expect(consumeDb.updates[1]).toEqual({ usedAt: 2000 });
	});
});
