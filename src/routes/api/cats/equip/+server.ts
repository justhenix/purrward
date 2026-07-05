// SECURITY: authenticated equip endpoint; cat ownership and item ownership are server-verified.
import type { RequestHandler } from './$types';
import { equipItem } from '$lib/server/inventory';

export const POST: RequestHandler = async ({ locals, request }) => {
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
		itemId
	});

	if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
	return Response.json(result.value);
};
