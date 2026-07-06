// Loads partner directory entries for the map mockup.
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { listPartners } from '$lib/server/partners';

export const load: PageServerLoad = async () => {
	return {
		partners: await listPartners(db)
	};
};
