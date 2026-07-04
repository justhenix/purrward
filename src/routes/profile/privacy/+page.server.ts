// Privacy page: authenticated account deletion.
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { deleteSessionCookie, shouldUseSecureCookie } from '$lib/server/auth';
import { deleteAccount } from '$lib/server/account';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/auth/login');
	return {};
};

export const actions: Actions = {
	deleteAccount: async ({ request, cookies, locals, url }) => {
		// SECURITY: only the authenticated owner can delete their own account.
		if (!locals.user) return fail(401, { message: 'Sign in first.', deleteError: true });

		const formData = await request.formData();
		if (formData.get('confirm') !== 'DELETE') {
			return fail(400, { message: 'Type DELETE to confirm.', deleteError: true });
		}

		try {
			const { db } = await import('$lib/server/db');
			await deleteAccount(db, locals.user.id);
		} catch {
			// SECURITY: never leak internal errors/stack traces to the client.
			return fail(500, { message: 'Could not delete account. Try again.', deleteError: true });
		}

		deleteSessionCookie(cookies, shouldUseSecureCookie(url));
		redirect(303, '/auth/login');
	}
};
