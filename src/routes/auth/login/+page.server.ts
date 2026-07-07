// Login page server actions for Google handoff and email/password auth.
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { setSessionCookie, shouldUseSecureCookie } from '$lib/server/auth';
import { isDisposableEmailDomain } from '$lib/server/email-domains';
import { parsePreferences, serializePreferences } from '$lib/server/preferences';
import {
	consumeAuthAttempt,
	passwordHelpText,
	readEmail,
	readPassword,
	registerEmailUser,
	signInWithEmail
} from '$lib/server/email-auth';

const GENERIC_LOGIN_ERROR = 'Email or password did not match.';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	guest: async ({ cookies, url }) => {
		const current = parsePreferences(cookies.get('purrward_prefs'));
		cookies.set('purrward_prefs', serializePreferences({ ...current, sandboxMode: true }), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: shouldUseSecureCookie(url),
			maxAge: 60 * 60 * 24 * 365
		});

		throw redirect(303, '/care-proof');
	},
	login: async ({ request, cookies, url, getClientAddress }) => {
		const { db } = await import('$lib/server/db');
		const rate = await consumeAuthAttempt({
			database: db,
			scope: 'login',
			clientAddress: getClientAddress()
		});
		const formData = await request.formData();
		const email = readEmail(formData);
		const password = readPassword(formData);
		const values = { email: readEmailValue(formData) };

		if (!rate.allowed) {
			return fail(429, {
				mode: 'login' as const,
				message: `Too many tries. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} min.`,
				values
			});
		}

		if (!email || !password) {
			return fail(400, { mode: 'login' as const, message: GENERIC_LOGIN_ERROR, values });
		}

		const result = await signInWithEmail({ database: db, email, password });
		if (!result) {
			return fail(400, { mode: 'login' as const, message: GENERIC_LOGIN_ERROR, values });
		}

		setSessionCookie(cookies, result.sessionId, shouldUseSecureCookie(url));
		throw redirect(303, '/');
	},
	register: async ({ request, cookies, url, getClientAddress }) => {
		const { db } = await import('$lib/server/db');
		const rate = await consumeAuthAttempt({
			database: db,
			scope: 'register',
			clientAddress: getClientAddress()
		});
		const formData = await request.formData();
		const email = readEmail(formData);
		const password = readPassword(formData);
		const values = { email: readEmailValue(formData) };

		if (!rate.allowed) {
			return fail(429, {
				mode: 'register' as const,
				message: `Too many tries. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} min.`,
				values
			});
		}

		if (!email || !password) {
			return fail(400, {
				mode: 'register' as const,
				message: 'Check email and password.',
				errors: {
					email: email ? undefined : 'Enter a valid email.',
					password: password ? undefined : passwordHelpText()
				},
				values
			});
		}

		// SECURITY: broad email support, but reject disposable/throwaway inboxes.
		if (isDisposableEmailDomain(email)) {
			return fail(400, {
				mode: 'register' as const,
				message: 'Please use a permanent email address.',
				errors: { email: 'Disposable email addresses are not allowed.' },
				values
			});
		}

		const result = await registerEmailUser({ database: db, email, password });
		if (!result) {
			return fail(400, {
				mode: 'register' as const,
				message: 'Could not create an account with that email.',
				values
			});
		}

		setSessionCookie(cookies, result.sessionId, shouldUseSecureCookie(url));
		throw redirect(303, '/');
	}
};

function readEmailValue(formData: FormData): string {
	const value = formData.get('email');
	return typeof value === 'string' ? value.trim().slice(0, 254) : '';
}
