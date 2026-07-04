// Cats route server: list, create, select, edit, and remove owner-scoped cats.
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { CAT_AVATARS } from '$lib/cat-avatars';
import {
	CAT_CAP,
	createCat,
	getActiveCat,
	listCats,
	removeCat,
	setActiveCat,
	updateCat
} from '$lib/server/cats';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/auth/login');

	const { db } = await import('$lib/server/db');
	const cats = await listCats(db, locals.user.id);
	const activeCat = await getActiveCat(db, locals.user.id);

	return {
		cats,
		activeCatId: activeCat?.id ?? null,
		avatars: CAT_AVATARS,
		catCap: CAT_CAP
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Sign in to add a cat.' });
		const formData = await request.formData();
		const { db } = await import('$lib/server/db');
		const result = await createCat(db, locals.user.id, {
			name: formData.get('name'),
			avatarId: formData.get('avatarId'),
			careMode: formData.get('careMode')
		});
		if (!result.ok) {
			return fail(result.status, { message: result.error, field: result.field, action: 'create' });
		}
		return { created: true };
	},
	select: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Sign in first.' });
		const formData = await request.formData();
		const catId = formData.get('catId');
		if (typeof catId !== 'string') return fail(400, { message: 'Choose a cat.' });
		const { db } = await import('$lib/server/db');
		const result = await setActiveCat(db, locals.user.id, catId);
		if (!result.ok) return fail(result.status, { message: result.error });
		return { selected: true };
	},
	update: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Sign in first.' });
		const formData = await request.formData();
		const catId = formData.get('catId');
		if (typeof catId !== 'string') return fail(400, { message: 'Choose a cat.' });
		const { db } = await import('$lib/server/db');
		const result = await updateCat(db, locals.user.id, catId, {
			name: formData.get('name') ?? undefined,
			avatarId: formData.get('avatarId') ?? undefined
		});
		if (!result.ok) {
			return fail(result.status, { message: result.error, field: result.field, action: 'update' });
		}
		return { updated: true };
	},
	remove: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Sign in first.' });
		const formData = await request.formData();
		const catId = formData.get('catId');
		if (typeof catId !== 'string') return fail(400, { message: 'Choose a cat.' });
		const { db } = await import('$lib/server/db');
		const result = await removeCat(db, locals.user.id, catId);
		if (!result.ok) return fail(result.status, { message: result.error });
		return { removed: true };
	}
};
