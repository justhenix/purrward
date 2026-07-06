// Rewards page server data from authenticated session and server-owned catalog.
import type { PageServerLoad } from './$types';
import { REWARDS } from '$lib/server/rewards';
import { daysUntilNextRotation, featuredRewardIds } from '$lib/featured';

export const load: PageServerLoad = async () => {
	const now = Date.now();
	const featuredIds = featuredRewardIds(
		REWARDS.map((r) => r.id),
		now
	);
	const daysUntilRotation = daysUntilNextRotation(now);

	// Keep the full catalog browsable (Req 9.6); featured ids drive the highlighted subset.
	return {
		rewards: REWARDS,
		featuredIds,
		daysUntilRotation
	};
};
