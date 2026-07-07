// SECURITY: authenticated equip endpoint; cat ownership and item ownership are server-verified.
import type { RequestHandler } from './$types';
import { equipItem } from '$lib/server/inventory';
import { parsePreferences } from '$lib/server/preferences';

export const POST: RequestHandler = async ({ cookies, locals, request }) => {
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

	const formData = await request.formData();
	// Absent or empty itemId means "unequip this slot".
	const rawItem = formData.get('itemId');
	const itemId = typeof rawItem === 'string' && rawItem.length > 0 ? rawItem : null;

	const { db } = await import('$lib/server/db');
	const result = await equipItem({
		database: db,
		userId: locals.user.id,
		catId: formData.get('catId'),
		slot: formData.get('slot'),
		itemId,
		// Sandbox mode mirrors home-scene behavior: allow equip of allowlisted cosmetics without owning.
		skipOwnership: parsePreferences(cookies.get('purrward_prefs')).sandboxMode
	});

	if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
	return Response.json(result.value);
};
