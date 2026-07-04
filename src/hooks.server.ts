// SECURITY: resolves request auth locals, applies IP rate limits, and browser hardening headers.
import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';
import { checkRateLimit, hashRateKey } from '$lib/server/rate-limit';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

// SECURITY: general 100/min per IP for /api/*, plus 10/hour per IP for auth attempts.
async function enforceIpRateLimit(event: {
	url: URL;
	request: Request;
	getClientAddress: () => string;
}): Promise<Response | null> {
	const path = event.url.pathname;
	const isApi = path.startsWith('/api/');
	const isAuthAttempt =
		path === '/auth/callback' || (event.request.method === 'POST' && path.startsWith('/auth/'));
	if (!isApi && !isAuthAttempt) return null;

	let ip: string;
	try {
		ip = event.getClientAddress();
	} catch {
		return null; // client address unavailable (e.g. some prerender contexts) — skip limiting
	}

	const { db } = await import('$lib/server/db');
	const key = await hashRateKey(ip);
	const decision = isAuthAttempt
		? await checkRateLimit({ database: db, key, action: 'auth', limit: 10, windowMs: HOUR_MS })
		: await checkRateLimit({ database: db, key, action: 'api', limit: 100, windowMs: MINUTE_MS });

	if (!decision.allowed) {
		return new Response(JSON.stringify({ error: 'Too many requests. Slow down and retry.' }), {
			status: 429,
			headers: { 'Content-Type': 'application/json', 'Retry-After': String(decision.retryAfter) }
		});
	}
	return null;
}

function createSecurityHeaders(scriptNonce: string): Record<string, string> {
	return {
		'Content-Security-Policy': [
			"default-src 'self'",
			`script-src 'self' 'nonce-${scriptNonce}'`,
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com data:",
			"img-src 'self' blob: data: https://*.googleusercontent.com",
			"connect-src 'self' https://generativelanguage.googleapis.com https://accounts.google.com",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self' https://accounts.google.com"
		].join('; '),
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'camera=(self), geolocation=(), microphone=()'
	};
}

function createScriptNonce(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function addScriptNonce(html: string, nonce: string): string {
	// SECURITY: SvelteKit emits an inline bootstrap; nonce it instead of allowing all inline scripts.
	return html.replace(/<script(?![^>]*\bnonce=)([^>]*)>/g, `<script nonce="${nonce}"$1>`);
}

function shouldSetHsts(url: URL): boolean {
	const host = url.hostname.toLowerCase();
	return url.protocol === 'https:' || (host !== 'localhost' && host !== '127.0.0.1');
}

export const handle: Handle = async ({ event, resolve }) => {
	const limited = await enforceIpRateLimit(event);
	if (limited) return limited;

	const sessionId = event.cookies.get('session');
	const result = sessionId ? await validateSession(sessionId) : null;

	event.locals.user = result?.user ?? null;
	event.locals.session = result?.session ?? null;

	const scriptNonce = createScriptNonce();
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => addScriptNonce(html, scriptNonce)
	});
	for (const [name, value] of Object.entries(createSecurityHeaders(scriptNonce))) {
		response.headers.set(name, value);
	}
	if (shouldSetHsts(event.url)) {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains; preload'
		);
	}
	return response;
};
