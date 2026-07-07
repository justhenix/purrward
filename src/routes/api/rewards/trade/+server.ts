// SECURITY: authenticated, rate-limited coupon-trade endpoint; status transitions are server-owned.
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { tradeCoupon } from '$lib/server/coupon-trade';
import { DEFAULT_COUPON_TRADE_DAILY_LIMIT, parsePositiveInt } from '$lib/server/rate-limit-config';
import { parsePreferences } from '$lib/server/preferences';

export const POST: RequestHandler = async ({ cookies, locals, request }) => {
	// SECURITY: authenticated users only.
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

	const formData = await request.formData();
	const preferences = parsePreferences(cookies.get('purrward_prefs'));
	// Sandbox is fully ephemeral: no status change, no DB writes, no rate limit.
	if (preferences.sandboxMode) {
		const redemptionId = formData.get('redemptionId');
		const partnerId = formData.get('partnerId');
		if (typeof redemptionId !== 'string' || redemptionId.length === 0) {
			return Response.json({ error: 'Invalid trade request.' }, { status: 400 });
		}
		if (typeof partnerId !== 'string' || partnerId.length === 0) {
			return Response.json({ error: 'Choose a valid partner.' }, { status: 400 });
		}
		return Response.json({ ok: true, redemptionId, partnerId, status: 'used' });
	}

	const { db } = await import('$lib/server/db');

	const result = await tradeCoupon({
		database: db,
		userId: locals.user.id,
		redemptionId: formData.get('redemptionId'),
		partnerId: formData.get('partnerId'),
		dailyLimit: parsePositiveInt(env.COUPON_TRADE_DAILY_LIMIT, DEFAULT_COUPON_TRADE_DAILY_LIMIT)
	});

	if (!result.ok) {
		const init: ResponseInit = { status: result.status };
		if (result.status === 429 && result.retryAfter) {
			init.headers = { 'Retry-After': String(result.retryAfter) };
		}
		return Response.json({ error: result.error }, init);
	}
	return Response.json(result);
};
