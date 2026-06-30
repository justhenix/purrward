// Rewards page server data from authenticated session and server-owned catalog.
import type { PageServerLoad } from './$types';
import { REWARDS } from '$lib/server/rewards';

export const load: PageServerLoad = async () => {
	return {
		rewards: REWARDS
	};
};
