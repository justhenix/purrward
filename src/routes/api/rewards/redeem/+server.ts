// SECURITY: authenticated reward redemption endpoint; point costs and codes are server-owned.
import type { RequestHandler } from './$types';
import { checkRedeemRateLimit, findReward, redeemReward } from '$lib/server/rewards';
import { parsePreferences } from '$lib/server/preferences';
import { SANDBOX_BALANCE } from '$lib/server/sandbox';

export const POST: RequestHandler = async ({ cookies, locals, request }) => {
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

	const formData = await request.formData();
	const preferences = parsePreferences(cookies.get('purrward_prefs'));
	// Sandbox is fully ephemeral: fake code, no deduction, no DB writes, no rate limit.
	if (preferences.sandboxMode) {
		const reward = findReward(formData.get('rewardId'));
		if (!reward) return Response.json({ error: 'Choose a valid reward.' }, { status: 400 });
		const stamp = Date.now().toString(36).toUpperCase();
		return Response.json({
			reward,
			balance: SANDBOX_BALANCE,
			code: `SANDBOX-${stamp.slice(-6)}`
		});
	}

	const { db } = await import('$lib/server/db');

	// SECURITY: per-user redeem cap (Retry-After on block).
	const limit = await checkRedeemRateLimit({ database: db, userId: locals.user.id });
	if (!limit.allowed) {
		return Response.json(
			{ error: 'Too many redemptions. Try again later.' },
			{ status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
		);
	}

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
