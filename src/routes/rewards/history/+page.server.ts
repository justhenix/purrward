// Loads the signed-in user's reward redemptions for the history/claimed view.
import type { PageServerLoad } from './$types';
import { listRedemptions } from '$lib/server/coupon-trade';
import { listPartners } from '$lib/server/partners';

export const load: PageServerLoad = async ({ locals }) => {
	// Sign-in prompt flag for guests (Req 8.5); no redemptions or partners to show.
	if (!locals.user) {
		return { authed: false, redemptions: [], partners: [] };
	}

	const { db } = await import('$lib/server/db');
	// Partners ride along so the history view's trade action can offer a partner picker.
	return {
		authed: true,
		redemptions: await listRedemptions(db, locals.user.id),
		partners: await listPartners(db)
	};
};
