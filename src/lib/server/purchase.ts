// SECURITY: server-owned direct purchase; cost and inventory writes never trust the client.
// T5 = direct item purchase endpoint (see ticket legend in db/schema.ts).
import { and, eq, gte, sql } from 'drizzle-orm';
import { userInventory, users } from './db/schema';
import { findItem, isPurchasableKind, type CatalogItem, type ItemKind } from './catalog';
import { checkRateLimit, hashRateKey, type RateLimitDecision } from './rate-limit';
import { SANDBOX_BALANCE } from './sandbox';

type Database = typeof import('./db').db;

// Per-user purchase cap. IP-level limiting already runs in hooks.server.ts.
export const PURCHASE_DAILY_LIMIT = 30;
export const PURCHASE_WINDOW_MS = 24 * 60 * 60 * 1000;

const MAX_PURCHASE_ATTEMPTS = 3;

export type PurchaseItem = {
	id: string;
	title: string;
	kind: ItemKind;
	desc: string;
	cost: number;
};

export type PurchaseResult =
	| { ok: true; item: PurchaseItem; balance: number }
	| { ok: false; status: number; error: string };

function toPurchaseItem(item: CatalogItem): PurchaseItem {
	return { id: item.id, title: item.title, kind: item.kind, desc: item.desc, cost: item.cost };
}

// A catalog item is for sale only if it is a purchasable kind with a real price (excludes free defaults).
function isForSale(item: CatalogItem | null): item is CatalogItem {
	return item !== null && isPurchasableKind(item.kind) && item.cost > 0;
}

// Drizzle wraps the driver error, so walk the cause chain for the UNIQUE-constraint signal.
function isUniqueConflict(error: unknown): boolean {
	let current: unknown = error;
	for (let depth = 0; depth < 5 && current instanceof Error; depth += 1) {
		if (current.message.includes('UNIQUE constraint failed')) return true;
		const code = (current as { code?: unknown }).code;
		if (typeof code === 'string' && code.includes('SQLITE_CONSTRAINT')) return true;
		current = (current as { cause?: unknown }).cause;
	}
	return false;
}

// SECURITY: per-user purchase rate limit; keyed by hashed user id so raw ids are never stored.
export async function checkPurchaseRateLimit(input: {
	database: Database;
	userId: string;
	now?: number;
}): Promise<RateLimitDecision> {
	return checkRateLimit({
		database: input.database,
		key: await hashRateKey(input.userId),
		action: 'item_purchase',
		limit: PURCHASE_DAILY_LIMIT,
		windowMs: PURCHASE_WINDOW_MS,
		now: input.now
	});
}

// Sandbox purchase: fake success, no DB write, no deduction — consistent with redeem/gacha sandbox.
export function sandboxPurchase(itemId: unknown): PurchaseResult {
	const item = findItem(itemId);
	if (!isForSale(item)) return { ok: false, status: 400, error: 'This item is not for sale.' };
	return { ok: true, item: toPurchaseItem(item), balance: SANDBOX_BALANCE };
}

// Spends points to buy one catalog item into account-wide inventory, atomically.
export async function purchaseItem(input: {
	database: Database;
	userId: string;
	itemId: unknown;
	now?: number;
}): Promise<PurchaseResult> {
	const item = findItem(input.itemId);
	if (!isForSale(item)) return { ok: false, status: 400, error: 'This item is not for sale.' };

	const now = input.now ?? Date.now();

	for (let attempt = 0; attempt < MAX_PURCHASE_ATTEMPTS; attempt += 1) {
		try {
			return await input.database.transaction(async (tx): Promise<PurchaseResult> => {
				// SECURITY: account-wide ownership check, scoped to this user.
				const owned = await tx
					.select({ id: userInventory.id })
					.from(userInventory)
					.where(and(eq(userInventory.userId, input.userId), eq(userInventory.itemId, item.id)))
					.limit(1);
				if (owned.length > 0)
					return { ok: false, status: 409, error: 'You already own this item.' };

				// SECURITY: conditional deduct guards against negative balance; 0 rows = not enough points.
				const rows = await tx
					.update(users)
					.set({ purrpoints: sql`${users.purrpoints} - ${item.cost}` })
					.where(and(eq(users.id, input.userId), gte(users.purrpoints, item.cost)))
					.returning({ balance: users.purrpoints });

				const balance = rows[0]?.balance;
				if (typeof balance !== 'number')
					return { ok: false, status: 409, error: 'Not enough Purrpoints.' };

				// SECURITY: unique (userId, itemId) is the duplicate/race backstop.
				await tx.insert(userInventory).values({
					userId: input.userId,
					itemId: item.id,
					kind: item.kind,
					source: 'purchase',
					acquiredAt: now
				});

				return { ok: true, item: toPurchaseItem(item), balance };
			});
		} catch (error) {
			// A concurrent purchase already took this item: rolled back (no deduct); retry re-sees ownership.
			if (isUniqueConflict(error) && attempt < MAX_PURCHASE_ATTEMPTS - 1) continue;
			if (isUniqueConflict(error))
				return { ok: false, status: 409, error: 'You already own this item.' };
			throw error;
		}
	}

	// Unreachable: the loop either returns a result or throws a non-conflict error.
	return { ok: false, status: 503, error: 'Could not complete the purchase. Please try again.' };
}
