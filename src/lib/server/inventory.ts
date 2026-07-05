// SECURITY: account-wide inventory ownership + per-cat equip logic; client ids are never trusted.
// T4 = inventory + equip endpoint (see ticket legend in db/schema.ts).
import { and, eq } from 'drizzle-orm';
import { userInventory } from './db/schema';
import { applyCatEquip, requireCatOwnership, type EquipState } from './cats';
import { isAccessoryId, isBackgroundId } from './catalog';

type Database = typeof import('./db').db;

export type EquipSlot = 'accessory' | 'background';

export type EquipResult =
	| { ok: true; value: EquipState }
	| { ok: false; status: number; error: string };

function isEquipSlot(value: unknown): value is EquipSlot {
	return value === 'accessory' || value === 'background';
}

// SECURITY: account-wide ownership check, scoped to this user.
export async function ownsItem(
	database: Database,
	userId: string,
	itemId: string
): Promise<boolean> {
	const rows = await database
		.select({ id: userInventory.id })
		.from(userInventory)
		.where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)))
		.limit(1);
	return rows.length > 0;
}

// Equips an owned item onto an owned cat, or unequips a slot when itemId is null.
export async function equipItem(input: {
	database: Database;
	userId: string;
	catId: unknown;
	slot: unknown;
	itemId: string | null;
}): Promise<EquipResult> {
	const { database, userId, slot, itemId } = input;

	// 1. (auth handled by the endpoint) — 2. cat belongs to user.
	if (typeof input.catId !== 'string') return { ok: false, status: 400, error: 'Choose a cat.' };
	const owned = await requireCatOwnership(database, userId, input.catId);
	if (!owned.ok) return { ok: false, status: owned.status, error: owned.error };

	// 3. slot is valid.
	if (!isEquipSlot(slot)) return { ok: false, status: 400, error: 'Choose a valid slot.' };

	// Equip path: validate allowlist + ownership. Unequip (null) skips both (item ownership check).
	if (itemId !== null) {
		// 4. itemId is allowlisted for that slot (blocks cross-slot ids and unknown ids).
		const allowedForSlot = slot === 'accessory' ? isAccessoryId(itemId) : isBackgroundId(itemId);
		if (!allowedForSlot)
			return { ok: false, status: 400, error: 'That item does not fit this slot.' };

		// 5. item exists in user_inventory for that user.
		if (!(await ownsItem(database, userId, itemId)))
			return { ok: false, status: 403, error: 'You do not own this item.' };
	}

	// 6. update only that owned cat.
	const patch = slot === 'accessory' ? { equippedAccessoryId: itemId } : { backgroundId: itemId };
	const state = await applyCatEquip(database, userId, input.catId, patch);
	return { ok: true, value: state };
}
