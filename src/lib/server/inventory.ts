// SECURITY: account-wide inventory ownership + per-cat equip logic; client ids are never trusted.
// T4 = inventory + equip endpoint (see ticket legend in db/schema.ts).
import { and, eq } from 'drizzle-orm';
import { catEquippedCosmetics, userInventory } from './db/schema';
import { applyCatEquip, requireCatOwnership, type EquipState } from './cats';
import {
	findAccessoryItem,
	findItem,
	isAccessorySlot,
	isBackgroundId,
	type AccessoryCatalogItem,
	type AccessorySlot
} from './catalog';

type Database = typeof import('./db').db;

export type EquipSlot = AccessorySlot | 'accessory' | 'background';
export type EquippedAccessory = {
	slot: AccessorySlot;
	itemId: string;
	assetId: string;
};
const ACCESSORY_SLOT_ORDER: Record<AccessorySlot, number> = { head: 0, neck: 1, face: 2 };

export type EquipResult =
	| { ok: true; value: EquipState }
	| { ok: false; status: number; error: string };

function isEquipSlot(value: unknown): value is EquipSlot {
	return value === 'accessory' || value === 'background' || isAccessorySlot(value);
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

export async function listEquippedAccessories(
	database: Database,
	userId: string,
	catId: string
): Promise<EquippedAccessory[]> {
	const rows = await database
		.select({ slot: catEquippedCosmetics.slot, itemId: catEquippedCosmetics.itemId })
		.from(catEquippedCosmetics)
		.where(and(eq(catEquippedCosmetics.userId, userId), eq(catEquippedCosmetics.catId, catId)));

	return rows
		.flatMap((row) => {
			const item = findAccessoryItem(row.itemId);
			if (!item || item.slot !== row.slot) return [];
			return [{ slot: item.slot, itemId: item.id, assetId: item.assetId }];
		})
		.sort((a, b) => ACCESSORY_SLOT_ORDER[a.slot] - ACCESSORY_SLOT_ORDER[b.slot]);
}

async function equipAccessory(input: {
	database: Database;
	userId: string;
	catId: string;
	item: AccessoryCatalogItem;
	now: number;
}): Promise<EquipState> {
	await input.database
		.insert(catEquippedCosmetics)
		.values({
			userId: input.userId,
			catId: input.catId,
			slot: input.item.slot,
			itemId: input.item.id,
			equippedAt: input.now
		})
		.onConflictDoUpdate({
			target: [catEquippedCosmetics.catId, catEquippedCosmetics.slot],
			set: { itemId: input.item.id, equippedAt: input.now, userId: input.userId }
		});

	// Back-compat for old readers/tests; slot table is the source of truth for rendering.
	return applyCatEquip(input.database, input.userId, input.catId, {
		equippedAccessoryId: input.item.id
	});
}

async function unequipAccessory(input: {
	database: Database;
	userId: string;
	catId: string;
	slot: EquipSlot;
}): Promise<EquipState> {
	const where =
		input.slot === 'accessory'
			? and(
					eq(catEquippedCosmetics.userId, input.userId),
					eq(catEquippedCosmetics.catId, input.catId)
				)
			: and(
					eq(catEquippedCosmetics.userId, input.userId),
					eq(catEquippedCosmetics.catId, input.catId),
					eq(catEquippedCosmetics.slot, input.slot)
				);

	await input.database.delete(catEquippedCosmetics).where(where);
	return applyCatEquip(input.database, input.userId, input.catId, { equippedAccessoryId: null });
}

// Equips an owned item onto an owned cat, or unequips a slot when itemId is null.
export async function equipItem(input: {
	database: Database;
	userId: string;
	catId: unknown;
	slot: unknown;
	itemId: string | null;
	skipOwnership?: boolean;
	now?: number;
}): Promise<EquipResult> {
	const { database, userId, slot, itemId } = input;

	// 1. (auth handled by the endpoint) — 2. cat belongs to user.
	if (typeof input.catId !== 'string') return { ok: false, status: 400, error: 'Choose a cat.' };
	const owned = await requireCatOwnership(database, userId, input.catId);
	if (!owned.ok) return { ok: false, status: owned.status, error: owned.error };

	// 3. slot is valid.
	if (!isEquipSlot(slot)) return { ok: false, status: 400, error: 'Choose a valid slot.' };

	if (itemId === null) {
		const state =
			slot === 'background'
				? await applyCatEquip(database, userId, input.catId, { backgroundId: null })
				: await unequipAccessory({ database, userId, catId: input.catId, slot });
		return { ok: true, value: state };
	}

	const item = findItem(itemId);
	if (!item) return { ok: false, status: 400, error: 'That item does not fit this slot.' };

	// Equip path: validate allowlist + ownership. Unequip (null) skips both (item ownership check).
	// 4. itemId is allowlisted for that slot (blocks cross-slot ids and unknown ids).
	if (slot === 'background') {
		if (!isBackgroundId(itemId))
			return { ok: false, status: 400, error: 'That item does not fit this slot.' };
	} else {
		const accessory = findAccessoryItem(itemId);
		if (!accessory || (slot !== 'accessory' && accessory.slot !== slot)) {
			return { ok: false, status: 400, error: 'That item does not fit this slot.' };
		}
	}

	// 5. item exists in user_inventory for that user unless sandbox explicitly bypasses ownership.
	if (!input.skipOwnership && !(await ownsItem(database, userId, itemId)))
		return { ok: false, status: 403, error: 'You do not own this item.' };

	// 6. update only that owned cat.
	const state =
		slot === 'background'
			? await applyCatEquip(database, userId, input.catId, { backgroundId: itemId })
			: await equipAccessory({
					database,
					userId,
					catId: input.catId,
					item: findAccessoryItem(itemId) as AccessoryCatalogItem,
					now: input.now ?? Date.now()
				});
	return { ok: true, value: state };
}
