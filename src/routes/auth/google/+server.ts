// SECURITY: Google OAuth initiation redirects to Google consent screen.
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { shouldUseSecureCookie } from '$lib/server/auth';
import { createOAuthStateCookie, getOAuthStartRedirect } from '$lib/server/google-oauth';

export const GET: RequestHandler = async ({ url }) => {
	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_REDIRECT_URI) {
		return new Response('Authentication is not configured.', { status: 500 });
	}

	const canonicalStart = getOAuthStartRedirect(url, env.GOOGLE_REDIRECT_URI);
	if (canonicalStart)
		return new Response(null, { status: 302, headers: { Location: canonicalStart } });

	const redirectUrl = new URL(env.GOOGLE_REDIRECT_URI);
	const state = crypto.randomUUID();
	const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
	googleUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
	googleUrl.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI);
	googleUrl.searchParams.set('response_type', 'code');
	googleUrl.searchParams.set('scope', 'openid email profile');
	googleUrl.searchParams.set('state', state);
	googleUrl.searchParams.set('access_type', 'online');
	googleUrl.searchParams.set('prompt', 'select_account');

	const headers = new Headers({ Location: googleUrl.toString() });
	headers.append('Set-Cookie', createOAuthStateCookie(state, shouldUseSecureCookie(redirectUrl)));

	return new Response(null, { status: 302, headers });
};
