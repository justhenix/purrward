// Home page server data from authenticated session locals.
import type { PageServerLoad } from './$types';
import { validateTaskType } from '$lib/server/security';

export const load: PageServerLoad = async ({ locals, url }) => {
	return {
		user: locals.user,
		selectedTask: validateTaskType(url.searchParams.get('task')) ?? 'feeding'
	};
};
