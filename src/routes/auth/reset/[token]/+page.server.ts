// Password reset confirmation action for one-time reset tokens.
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { setSessionCookie, shouldUseSecureCookie } from '$lib/server/auth';
import {
	consumeAuthAttempt,
	passwordHelpText,
	readPassword,
	resetPasswordWithToken
} from '$lib/server/email-auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, params, cookies, url, getClientAddress }) => {
		const { db } = await import('$lib/server/db');
		const rate = await consumeAuthAttempt({
			database: db,
			scope: 'reset',
			clientAddress: getClientAddress(),
			limit: 5
		});
		const formData = await request.formData();
		const password = readPassword(formData);
		const confirmPassword = readPassword(formData, 'confirmPassword');

		if (!rate.allowed) {
			return fail(429, {
				message: `Too many tries. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} min.`
			});
		}

		if (!password || !confirmPassword) {
			return fail(400, { message: passwordHelpText() });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match.' });
		}

		const result = await resetPasswordWithToken({
			database: db,
			token: params.token,
			password
		});
		if (!result) {
			return fail(400, { message: 'Reset link is invalid or expired.' });
		}

		setSessionCookie(cookies, result.sessionId, shouldUseSecureCookie(url));
		throw redirect(303, '/');
	}
};
