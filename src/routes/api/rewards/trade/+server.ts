// SECURITY: authenticated, rate-limited coupon-trade endpoint; status transitions are server-owned.
import type { RequestHandler } from './$types';
import { checkRateLimit, hashRateKey } from '$lib/server/rate-limit';
import { tradeCoupon } from '$lib/server/coupon-trade';
import { parsePreferences } from '$lib/server/preferences';

// SECURITY: per-user coupon-trade cap. IP-level limiting already runs in hooks.server.ts.
const TRADE_LIMIT = 20;
const TRADE_WINDOW_MS = 60 * 60 * 1000;

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

	// SECURITY: per-user trade cap (Retry-After on block); key hashed so raw ids are never stored.
	const limit = await checkRateLimit({
		database: db,
		key: await hashRateKey(locals.user.id),
		action: 'coupon_trade',
		limit: TRADE_LIMIT,
		windowMs: TRADE_WINDOW_MS
	});
	if (!limit.allowed) {
		return Response.json(
			{ error: 'Too many trades. Try again later.' },
			{ status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
		);
	}

	const result = await tradeCoupon({
		database: db,
		userId: locals.user.id,
		redemptionId: formData.get('redemptionId'),
		partnerId: formData.get('partnerId')
	});

	if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
	return Response.json(result);
};
