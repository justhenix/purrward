// SECURITY: server-owned economy catalog; only allowlisted item ids are ever trusted.
// Part of T1 (economy schema + unified catalog + allowlists). See the ticket legend in db/schema.ts.

// Redeemable rewards produce a code (reward_redemptions); accessory/background are owned (user_inventory).
export type ItemKind = 'accessory' | 'background' | 'coupon' | 'vet' | 'donation';

// Legacy store category retained for reward-kind items so the existing rewards UI keeps working.
export type RewardCategory = 'vet' | 'treat' | 'toy' | 'shelter';
export type AccessorySlot = 'head' | 'neck' | 'face';
export type CosmeticTier = 'common' | 'rare' | 'epic';
export type AcquisitionMethod = 'purchase' | 'gacha' | 'both';
export type AccessoryPlacement = {
	x: string;
	y: string;
	scale: number;
};

export type CatalogItem = {
	id: string;
	title: string;
	cost: number;
	desc: string;
	kind: ItemKind;
	// Present only on redeemable rewards; drives the current rewards store chips/icons.
	category?: RewardCategory;
	// True when the item can be won from the gacha pool (accessory/background only).
	gacha?: boolean;
	acquisition?: AcquisitionMethod;
	slot?: AccessorySlot;
	tier?: CosmeticTier;
	assetId?: string;
	placement?: AccessoryPlacement;
};

// Default background applied when a cat's backgroundId is null (read-time default, never stored).
export const DEFAULT_BACKGROUND_ID = 'bg_home';

export const CATALOG: CatalogItem[] = [
	// Redeemable rewards — order preserved to match the current rewards store layout.
	{
		id: 'vet_discount',
		title: 'Vet Visit Discount',
		cost: 100,
		desc: 'Save on a clinic visit.',
		kind: 'vet',
		category: 'vet'
	},
	{
		id: 'cat_treats',
		title: 'Tuna Treats',
		cost: 150,
		desc: 'Cat snack reward.',
		kind: 'coupon',
		category: 'treat'
	},
	{
		id: 'feather_wand',
		title: 'Feather Wand',
		cost: 200,
		desc: 'A soft play toy.',
		kind: 'coupon',
		category: 'toy'
	},
	{
		id: 'shelter_don',
		title: 'Shelter Meal',
		cost: 200,
		desc: 'Help a shelter cat.',
		kind: 'donation',
		category: 'shelter'
	},
	// Accessories — owned account-wide, gacha-eligible.
	{
		id: 'acc_bandana',
		title: 'Bandana',
		cost: 80,
		desc: 'Dress your cat.',
		kind: 'accessory',
		gacha: true,
		acquisition: 'both',
		slot: 'neck',
		tier: 'common',
		assetId: 'bandana',
		placement: { x: '50%', y: '50%', scale: 1 }
	},
	{
		id: 'acc_bucket_hat',
		title: 'Bucket Hat',
		cost: 100,
		desc: 'Dress your cat.',
		kind: 'accessory',
		gacha: true,
		acquisition: 'both',
		slot: 'head',
		tier: 'rare',
		assetId: 'bucket_hat',
		placement: { x: '50%', y: '50%', scale: 1 }
	},
	{
		id: 'acc_flower_crown',
		title: 'Flower Crown',
		cost: 120,
		desc: 'Dress your cat.',
		kind: 'accessory',
		gacha: true,
		acquisition: 'both',
		slot: 'head',
		tier: 'epic',
		assetId: 'flower_corn',
		placement: { x: '50%', y: '50%', scale: 1 }
	},
	{
		id: 'acc_nerd_glasses',
		title: 'Round Glasses',
		cost: 90,
		desc: 'Dress your cat.',
		kind: 'accessory',
		gacha: true,
		acquisition: 'both',
		slot: 'face',
		tier: 'common',
		assetId: 'nerd_glasses',
		placement: { x: '50%', y: '50%', scale: 1 }
	},
	{
		id: 'acc_sun_glasses',
		title: 'Sun Glasses',
		cost: 90,
		desc: 'Dress your cat.',
		kind: 'accessory',
		gacha: true,
		acquisition: 'both',
		slot: 'face',
		tier: 'rare',
		assetId: 'sun_glasses',
		placement: { x: '50%', y: '50%', scale: 1 }
	},
	// Backgrounds — owned account-wide. bg_home is the free default; not sold, not in gacha.
	{
		id: DEFAULT_BACKGROUND_ID,
		title: 'Home Corner',
		cost: 0,
		desc: 'The cozy default spot.',
		kind: 'background'
	},
	{
		id: 'bg_park',
		title: 'Cat Park',
		cost: 80,
		desc: 'A sunny day out.',
		kind: 'background'
	},
	{
		id: 'bg_window',
		title: 'Sunny Windowsill',
		cost: 80,
		desc: 'A warm perch by the glass.',
		kind: 'background'
	},
	{
		id: 'bg_garden',
		title: 'Garden Nook',
		cost: 100,
		desc: 'Green and breezy.',
		kind: 'background'
	}
];

export function findItem(id: unknown): CatalogItem | null {
	if (typeof id !== 'string') return null;
	return CATALOG.find((item) => item.id === id) ?? null;
}

export function isAccessoryId(id: unknown): boolean {
	return findItem(id)?.kind === 'accessory';
}

export function isBackgroundId(id: unknown): boolean {
	return findItem(id)?.kind === 'background';
}

export function isGachaEligible(id: unknown): boolean {
	return findItem(id)?.gacha === true;
}

// Redeemable kinds produce a code and a reward_redemptions row (T2), never an owned item.
export function isRedeemableKind(kind: ItemKind): boolean {
	return kind === 'coupon' || kind === 'vet' || kind === 'donation';
}

// The gacha pull pool (T3): every gacha-eligible catalog item.
export const GACHA_POOL: CatalogItem[] = CATALOG.filter((item) => item.gacha === true);

// Purchasable kinds (T5): owned items only. Gacha-eligibility does not block direct purchase.
export function isPurchasableKind(kind: ItemKind): boolean {
	return kind === 'accessory' || kind === 'background';
}

export type AccessoryCatalogItem = CatalogItem & {
	kind: 'accessory';
	slot: AccessorySlot;
	tier: CosmeticTier;
	assetId: string;
	placement: AccessoryPlacement;
};

export function isAccessorySlot(value: unknown): value is AccessorySlot {
	return value === 'head' || value === 'neck' || value === 'face';
}

export function isAccessoryItem(item: CatalogItem | null): item is AccessoryCatalogItem {
	return (
		item?.kind === 'accessory' &&
		isAccessorySlot(item.slot) &&
		typeof item.assetId === 'string' &&
		item.assetId.length > 0 &&
		item.tier !== undefined &&
		item.placement !== undefined
	);
}

export function findAccessoryItem(id: unknown): AccessoryCatalogItem | null {
	const item = findItem(id);
	return isAccessoryItem(item) ? item : null;
}

export const ACCESSORIES: AccessoryCatalogItem[] = CATALOG.filter(isAccessoryItem);
