// SECURITY: authenticated gacha pull; item, cost, and inventory writes are server-owned.
import type { RequestHandler } from './$types';
import { checkGachaRateLimit, pullGacha, sandboxPull } from '$lib/server/gacha';
import { parsePreferences } from '$lib/server/preferences';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

	const preferences = parsePreferences(cookies.get('purrward_prefs'));
	// Sandbox is fully ephemeral: fake item, no deduction, no DB writes, no rate limit.
	if (preferences.sandboxMode) {
		return Response.json(sandboxPull());
	}

	const { db } = await import('$lib/server/db');

	// SECURITY: per-user pull cap (Retry-After on block).
	const limit = await checkGachaRateLimit({ database: db, userId: locals.user.id });
	if (!limit.allowed) {
		return Response.json(
			{ error: 'Too many pulls. Try again later.' },
			{ status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
		);
	}

	const result = await pullGacha({ database: db, userId: locals.user.id });
	if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
	return Response.json({ item: result.item, balance: result.balance });
};
