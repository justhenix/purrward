// Onboarding server: first-cat setup with owned vs free (community) cat paths.
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { CAT_AVATARS } from '$lib/cat-avatars';
import { createCat, defaultCommunityName, listCats } from '$lib/server/cats';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/auth/login');

	const { db } = await import('$lib/server/db');
	const cats = await listCats(db, locals.user.id);
	// Already has a cat — onboarding is done.
	if (cats.length > 0) redirect(303, '/');

	return { avatars: CAT_AVATARS };
};

export const actions: Actions = {
	owned: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Sign in to add a cat.', field: null });

		const formData = await request.formData();
		const { db } = await import('$lib/server/db');
		const result = await createCat(db, locals.user.id, {
			name: formData.get('name'),
			avatarId: formData.get('avatarId'),
			careMode: 'owned'
		});
		if (!result.ok) {
			return fail(result.status, { message: result.error, field: result.field ?? null });
		}
		redirect(303, '/');
	},
	community: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Sign in to add a cat.', field: null });

		const formData = await request.formData();
		const rawName = formData.get('name');
		const name =
			typeof rawName === 'string' && rawName.trim().length > 0 ? rawName : defaultCommunityName();
		const avatarId = formData.get('avatarId') ?? CAT_AVATARS[0].id;

		const { db } = await import('$lib/server/db');
		const result = await createCat(db, locals.user.id, {
			name,
			avatarId,
			careMode: 'community'
		});
		if (!result.ok) {
			return fail(result.status, { message: result.error, field: result.field ?? null });
		}
		redirect(303, '/');
	}
};
