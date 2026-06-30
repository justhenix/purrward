// SECURITY: authenticated reward redemption endpoint; point costs are server-owned.
import type { RequestHandler } from './$types';
import { redeemReward } from '$lib/server/rewards';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

	const { db } = await import('$lib/server/db');
	const formData = await request.formData();
	const result = await redeemReward({
		database: db,
		userId: locals.user.id,
		rewardId: formData.get('rewardId')
	});

	if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
	return Response.json({
		reward: result.reward,
		balance: result.balance,
		code: result.code
	});
};
