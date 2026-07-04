// Profile settings actions: edit parent name and choose the profile picture.
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { shouldUseSecureCookie } from '$lib/server/auth';
import { updateParentName } from '$lib/server/account';
import { parsePreferences, serializePreferences } from '$lib/server/preferences';
import { validateAvatarChoice } from '$lib/avatar-ids';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/auth/login');
	return {};
};

export const actions: Actions = {
	name: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Sign in first.', field: 'name' });
		const formData = await request.formData();
		const { db } = await import('$lib/server/db');
		const saved = await updateParentName(db, locals.user.id, formData.get('parentName'));
		if (!saved) return fail(400, { message: 'Enter a name (1 to 40 characters).', field: 'name' });
		return { savedName: true };
	},
	avatar: async ({ request, cookies, locals, url }) => {
		if (!locals.user) return fail(401, { message: 'Sign in first.' });
		const formData = await request.formData();
		const current = parsePreferences(cookies.get('purrward_prefs'));
		const preferences = {
			...current,
			avatarChoice: validateAvatarChoice(formData.get('avatarChoice')?.toString())
		};
		cookies.set('purrward_prefs', serializePreferences(preferences), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: shouldUseSecureCookie(url),
			maxAge: 60 * 60 * 24 * 365
		});
		return { savedAvatar: true };
	}
};
