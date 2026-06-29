// SECURITY: resolves request auth locals and browser hardening headers.
import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';

const securityHeaders = {
	'Content-Security-Policy':
		"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' https://generativelanguage.googleapis.com https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com;",
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), geolocation=(), microphone=()'
};

function shouldSetHsts(url: URL): boolean {
	const host = url.hostname.toLowerCase();
	return url.protocol === 'https:' || (host !== 'localhost' && host !== '127.0.0.1');
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');
	const result = sessionId ? await validateSession(sessionId) : null;

	event.locals.user = result?.user ?? null;
	event.locals.session = result?.session ?? null;

	const response = await resolve(event);
	for (const [name, value] of Object.entries(securityHeaders)) response.headers.set(name, value);
	if (shouldSetHsts(event.url)) {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains; preload'
		);
	}
	return response;
};
