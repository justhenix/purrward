// Layout server load: session, preferences, and the user's cats + active cat context.
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { parsePreferences } from '$lib/server/preferences';
import { getActiveCat, listCats, type CatProfile } from '$lib/server/cats';

export const load: LayoutServerLoad = async ({ cookies, locals, url, depends }) => {
	depends('app:cat');
	const preferences = parsePreferences(cookies.get('purrward_prefs'));
	let cats: CatProfile[] = [];
	let activeCat: CatProfile | null = null;

	if (locals.user) {
		const { db } = await import('$lib/server/db');
		cats = await listCats(db, locals.user.id);
		activeCat = (await getActiveCat(db, locals.user.id)) ?? cats[0] ?? null;

		const path = url.pathname;
		// Send freshly authenticated users with no cat to onboarding (avoid redirect loops).
		if (cats.length === 0 && !path.startsWith('/onboarding') && !path.startsWith('/auth/')) {
			redirect(303, '/onboarding');
		}
	}

	return {
		user: locals.user,
		preferences,
		cats,
		activeCat
	};
};
