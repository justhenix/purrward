// Rewards page server data from authenticated session and server-owned catalog.
import type { PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { REWARDS } from '$lib/server/rewards';
import { daysUntilNextRotation, featuredRewardIds } from '$lib/featured';
import { GACHA_PULL_COST, GACHA_TIER_ODDS } from '$lib/server/gacha';
import { ACCESSORIES, CATALOG, DEFAULT_BACKGROUND_ID } from '$lib/server/catalog';
import { listEquippedAccessories } from '$lib/server/inventory';
import { userInventory } from '$lib/server/db/schema';

const REWARD_SCENE_IDS = [DEFAULT_BACKGROUND_ID, 'bg_park'] as const;

export const load: PageServerLoad = async ({ locals, parent, depends }) => {
	depends('app:rewards');
	const now = Date.now();
	const parentData = await parent();
	const featuredIds = featuredRewardIds(
		REWARDS.map((r) => r.id),
		now
	);
	const daysUntilRotation = daysUntilNextRotation(now);
	const ownedItemIds = new Set<string>();
	const user = locals.user;
	const activeCat = parentData.activeCat;
	const equippedAccessories: Awaited<ReturnType<typeof listEquippedAccessories>> = [];
	if (user && activeCat) {
		const { db } = await import('$lib/server/db');
		const ownedRows = await db
			.select({ itemId: userInventory.itemId })
			.from(userInventory)
			.where(eq(userInventory.userId, user.id));
		for (const row of ownedRows) ownedItemIds.add(row.itemId);
		equippedAccessories.push(...(await listEquippedAccessories(db, user.id, activeCat.id)));
	}

	const equippedAccessoryIds = new Set(equippedAccessories.map((item) => item.itemId));
	const activeBackgroundId = parentData.activeCat?.backgroundId ?? DEFAULT_BACKGROUND_ID;
	const sandboxOwned = parentData.preferences.sandboxMode;

	// Keep the full catalog browsable (Req 9.6); featured ids drive the highlighted subset.
	return {
		rewards: REWARDS,
		featuredIds,
		daysUntilRotation,
		gachaCost: GACHA_PULL_COST,
		gachaOdds: GACHA_TIER_ODDS,
		accessories: ACCESSORIES.map((item) => ({
			id: item.id,
			title: item.title,
			cost: item.cost,
			slot: item.slot,
			tier: item.tier,
			assetId: item.assetId,
			placement: item.placement,
			owned: sandboxOwned || ownedItemIds.has(item.id),
			equipped: equippedAccessoryIds.has(item.id)
		})),
		scenes: REWARD_SCENE_IDS.map((id) => {
			const item = CATALOG.find((catalogItem) => catalogItem.id === id);
			return {
				id,
				title: id === DEFAULT_BACKGROUND_ID ? 'Room' : 'Park',
				cost: item?.cost ?? 0,
				owned: id === DEFAULT_BACKGROUND_ID || sandboxOwned || ownedItemIds.has(id),
				equipped: activeBackgroundId === id
			};
		})
	};
};
