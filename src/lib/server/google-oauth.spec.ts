import { describe, expect, it } from 'vitest';
import {
	authFailure,
	clearOAuthStateCookie,
	createOAuthStateCookie,
	getOAuthStartRedirect,
	handleGoogleCallback
} from './google-oauth';

function createDatabase(inserts: unknown[]) {
	return {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: async () => []
				})
			})
		}),
		insert: () => ({
			values: async (value: unknown) => {
				inserts.push(value);
			}
		}),
		delete: () => ({
			where: async () => undefined
		})
	} as unknown as Parameters<typeof handleGoogleCallback>[0]['database'];
}

describe('google oauth callback', () => {
	it('returns a generic auth failure', async () => {
		const response = authFailure();

		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Authentication failed.');
	});

	it('uses Lax for oauth state cookies so Google redirects keep state', () => {
		expect(createOAuthStateCookie('state-1', false)).toBe(
			'oauth_state=state-1; HttpOnly; SameSite=Lax; Path=/auth; Max-Age=600'
		);
		expect(clearOAuthStateCookie(false)).toContain('SameSite=Lax');
	});

	it('keeps oauth state cookie and callback on the same local origin', () => {
		expect(
			getOAuthStartRedirect(
				new URL('http://127.0.0.1:5173/auth/google'),
				'http://localhost:5173/auth/callback'
			)
		).toBe('http://localhost:5173/auth/google');

		expect(
			getOAuthStartRedirect(
				new URL('http://localhost:5173/auth/google'),
				'http://localhost:5173/auth/callback'
			)
		).toBeNull();
	});

	it('keeps public oauth starts on the callback origin', () => {
		expect(
			getOAuthStartRedirect(
				new URL('https://www.purrward.app/auth/google'),
				'https://purrward.app/auth/callback'
			)
		).toBe('https://purrward.app/auth/google');
	});

	it('creates user and session from valid Google responses', async () => {
		const inserts: unknown[] = [];
		let calls = 0;
		const fetcher = async () => {
			calls += 1;
			if (calls === 1) return new Response(JSON.stringify({ access_token: 'token' }));
			return new Response(
				JSON.stringify({
					sub: 'google-1',
					email: 'cat@example.com',
					email_verified: true,
					name: 'Cat Parent',
					picture: 'https://example.com/avatar.png'
				})
			);
		};

		const response = await handleGoogleCallback({
			code: 'code',
			fetcher,
			database: createDatabase(inserts),
			config: {
				clientId: 'client',
				clientSecret: 'secret',
				redirectUri: 'http://localhost:5173/auth/callback'
			},
			secureCookie: false
		});

		const setCookie = response.headers.get('set-cookie') ?? '';
		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('/');
		expect(setCookie).toContain('session=');
		expect(inserts).toHaveLength(2);
	});
});
