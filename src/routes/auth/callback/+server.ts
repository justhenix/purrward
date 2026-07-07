// SECURITY: Google OAuth callback exchanges code server-side and creates a session.
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { shouldUseSecureCookie } from '$lib/server/auth';
import { authFailure, handleGoogleCallback } from '$lib/server/google-oauth';

export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
	const expectedState = cookies.get('oauth_state');
	const state = url.searchParams.get('state');
	const code = url.searchParams.get('code');
	if (!expectedState || !state || expectedState !== state || !code) return authFailure();

	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
		return new Response('Authentication is not configured.', { status: 500 });
	}

	const { db } = await import('$lib/server/db');
	const redirectUrl = new URL(env.GOOGLE_REDIRECT_URI);
	return handleGoogleCallback({
		code,
		fetcher: fetch,
		database: db,
		config: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
			redirectUri: env.GOOGLE_REDIRECT_URI
		},
		secureCookie: shouldUseSecureCookie(redirectUrl)
	});
};
