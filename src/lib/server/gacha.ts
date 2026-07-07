// SECURITY: server-owned gacha pull; item selection, cost, and inventory writes never trust the client.
// T3 = gacha pull endpoint (see ticket legend in db/schema.ts).
import { and, eq, gte, sql } from 'drizzle-orm';
import { userInventory, users } from './db/schema';
import { GACHA_POOL, type CatalogItem, type CosmeticTier, type ItemKind } from './catalog';
import { checkRateLimit, hashRateKey, type RateLimitDecision } from './rate-limit';
import { SANDBOX_BALANCE } from './sandbox';

type Database = typeof import('./db').db;

// SECURITY: cost is server-owned; the client never supplies or influences it.
export const GACHA_PULL_COST = 30;
export const GACHA_DUPLICATE_REFUND = 5;
export const GACHA_TIER_ODDS: Record<CosmeticTier, number> = {
	common: 70,
	rare: 22,
	epic: 8
};

// Per-user pull cap. IP-level limiting already runs in hooks.server.ts.
export const GACHA_DAILY_LIMIT = 30;
export const GACHA_WINDOW_MS = 24 * 60 * 60 * 1000;

const MAX_PULL_ATTEMPTS = 3;

export type GachaItem = {
	id: string;
	title: string;
	kind: ItemKind;
	desc: string;
	tier?: CosmeticTier;
};

export type GachaResult =
	| { ok: true; item: GachaItem; balance: number; duplicate: boolean; refund: number }
	| { ok: false; status: number; error: string };

function toGachaItem(item: CatalogItem): GachaItem {
	return { id: item.id, title: item.title, kind: item.kind, desc: item.desc, tier: item.tier };
}

function randomIndex(size: number): number {
	return crypto.getRandomValues(new Uint32Array(1))[0] % size;
}

// SECURITY: server-side weighted tier pick; client only receives the result.
function randomPick(pool: CatalogItem[]): CatalogItem {
	const roll = randomIndex(100);
	let threshold = 0;
	let tier: CosmeticTier = 'common';
	for (const [name, weight] of Object.entries(GACHA_TIER_ODDS) as [CosmeticTier, number][]) {
		threshold += weight;
		if (roll < threshold) {
			tier = name;
			break;
		}
	}
	const candidates = pool.filter((item) => item.tier === tier);
	const weightedPool = candidates.length > 0 ? candidates : pool;
	return weightedPool[randomIndex(weightedPool.length)];
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

// SECURITY: per-user gacha rate limit; keyed by hashed user id so raw ids are never stored.
export async function checkGachaRateLimit(input: {
	database: Database;
	userId: string;
	now?: number;
}): Promise<RateLimitDecision> {
	return checkRateLimit({
		database: input.database,
		key: await hashRateKey(input.userId),
		action: 'gacha_pull',
		limit: GACHA_DAILY_LIMIT,
		windowMs: GACHA_WINDOW_MS,
		now: input.now
	});
}

// Sandbox pull: fake result, no DB write, no deduction — consistent with the redeem sandbox path.
export function sandboxPull(): {
	item: GachaItem;
	balance: number;
	duplicate: boolean;
	refund: number;
} {
	return {
		item: toGachaItem(GACHA_POOL[0]),
		balance: SANDBOX_BALANCE,
		duplicate: false,
		refund: 0
	};
}

// Spends points to grant one unowned gacha item into account-wide inventory, atomically.
export async function pullGacha(input: {
	database: Database;
	userId: string;
	now?: number;
	// Overridable only for tests; production uses the crypto random pick.
	pick?: (pool: CatalogItem[]) => CatalogItem;
}): Promise<GachaResult> {
	const now = input.now ?? Date.now();
	const pick = input.pick ?? randomPick;

	for (let attempt = 0; attempt < MAX_PULL_ATTEMPTS; attempt += 1) {
		try {
			return await input.database.transaction(async (tx): Promise<GachaResult> => {
				// SECURITY: ownership is account-wide and scoped to this user.
				const owned = await tx
					.select({ itemId: userInventory.itemId })
					.from(userInventory)
					.where(eq(userInventory.userId, input.userId));
				const ownedIds = new Set(owned.map((row) => row.itemId));

				// SECURITY: conditional deduct guards against negative balance; 0 rows = not enough points.
				const rows = await tx
					.update(users)
					.set({ purrpoints: sql`${users.purrpoints} - ${GACHA_PULL_COST}` })
					.where(and(eq(users.id, input.userId), gte(users.purrpoints, GACHA_PULL_COST)))
					.returning({ balance: users.purrpoints });

				const balance = rows[0]?.balance;
				if (typeof balance !== 'number')
					return { ok: false, status: 409, error: 'Not enough Purrpoints.' };

				const item = pick(GACHA_POOL);
				if (ownedIds.has(item.id)) {
					const refunded = await tx
						.update(users)
						.set({ purrpoints: sql`${users.purrpoints} + ${GACHA_DUPLICATE_REFUND}` })
						.where(eq(users.id, input.userId))
						.returning({ balance: users.purrpoints });
					return {
						ok: true,
						item: toGachaItem(item),
						balance: refunded[0]?.balance ?? balance + GACHA_DUPLICATE_REFUND,
						duplicate: true,
						refund: GACHA_DUPLICATE_REFUND
					};
				}

				// SECURITY: unique (userId, itemId) is the duplicate/race backstop.
				await tx.insert(userInventory).values({
					userId: input.userId,
					itemId: item.id,
					kind: item.kind,
					source: 'gacha',
					acquiredAt: now
				});

				return { ok: true, item: toGachaItem(item), balance, duplicate: false, refund: 0 };
			});
		} catch (error) {
			// A concurrent pull already took this item: the transaction rolled back (no deduct); retry.
			if (isUniqueConflict(error) && attempt < MAX_PULL_ATTEMPTS - 1) continue;
			if (isUniqueConflict(error))
				return { ok: false, status: 503, error: 'Could not complete the pull. Please try again.' };
			throw error;
		}
	}

	// Unreachable: the loop either returns a result or throws a non-conflict error.
	return { ok: false, status: 503, error: 'Could not complete the pull. Please try again.' };
}
