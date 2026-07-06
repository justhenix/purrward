// SECURITY: authenticated direct purchase; cost and inventory writes are server-owned.
import type { RequestHandler } from './$types';
import { checkPurchaseRateLimit, purchaseItem, sandboxPurchase } from '$lib/server/purchase';
import { parsePreferences } from '$lib/server/preferences';

export const POST: RequestHandler = async ({ cookies, locals, request }) => {
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

	const formData = await request.formData();
	const itemId = formData.get('itemId');
	const preferences = parsePreferences(cookies.get('purrward_prefs'));

	// Sandbox is fully ephemeral: fake success, no deduction, no DB writes, no rate limit.
	if (preferences.sandboxMode) {
		const result = sandboxPurchase(itemId);
		if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
		return Response.json({ item: result.item, balance: result.balance });
	}

	const { db } = await import('$lib/server/db');

	// SECURITY: per-user purchase cap (Retry-After on block).
	const limit = await checkPurchaseRateLimit({ database: db, userId: locals.user.id });
	if (!limit.allowed) {
		return Response.json(
			{ error: 'Too many purchases. Try again later.' },
			{ status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
		);
	}

	const result = await purchaseItem({ database: db, userId: locals.user.id, itemId });
	if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
	return Response.json({ item: result.item, balance: result.balance });
};
