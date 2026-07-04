// Password reset request page with generic account-safe responses.
import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	canShowDevResetLink,
	consumeAuthAttempt,
	createPasswordResetUrl,
	readEmail,
	requestPasswordReset
} from '$lib/server/email-auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, url, getClientAddress }) => {
		const { db } = await import('$lib/server/db');
		const rate = await consumeAuthAttempt({
			database: db,
			scope: 'forgot',
			clientAddress: getClientAddress(),
			limit: 5
		});
		const formData = await request.formData();
		const email = readEmail(formData);
		const values = { email: readEmailValue(formData) };

		if (!rate.allowed) {
			return fail(429, {
				message: `Too many tries. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} min.`,
				values
			});
		}

		if (!email) {
			return fail(400, { message: 'Enter a valid email address.', values });
		}

		const result = await requestPasswordReset({ database: db, email });
		const devResetPath =
			result && canShowDevResetLink(url, env.DEV_AUTH_RESET_LINKS)
				? new URL(createPasswordResetUrl(url.origin, result.token)).pathname
				: undefined;

		return {
			message: 'If that email uses a password, a reset link has been prepared.',
			devResetPath,
			values
		};
	}
};

function readEmailValue(formData: FormData): string {
	const value = formData.get('email');
	return typeof value === 'string' ? value.trim().slice(0, 254) : '';
}
