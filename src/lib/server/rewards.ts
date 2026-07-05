// SECURITY: server-owned reward catalog and redemption logic.
import { and, eq, gte, sql } from 'drizzle-orm';
import { rewardRedemptions, users } from './db/schema';
import { CATALOG, findItem, isRedeemableKind, type RewardCategory } from './catalog';
import { checkRateLimit, hashRateKey, type RateLimitDecision } from './rate-limit';

type Database = typeof import('./db').db;

export type RewardItem = {
	id: string;
	title: string;
	cost: number;
	desc: string;
	category: RewardCategory;
};

// Redeemable rewards are the catalog items that carry a store category (source of truth: catalog.ts).
// Folded into the unified catalog in T1; redeem persistence is T2 (see ticket legend in db/schema.ts).
export const REWARDS: RewardItem[] = CATALOG.filter(
	(item): item is CatalogItemWithCategory => item.category !== undefined
).map((item) => ({
	id: item.id,
	title: item.title,
	cost: item.cost,
	desc: item.desc,
	category: item.category
}));

type CatalogItemWithCategory = (typeof CATALOG)[number] & { category: RewardCategory };

// SECURITY: per-user redeem cap. IP-level limiting already runs in hooks.server.ts.
export const REDEEM_DAILY_LIMIT = 20;
export const REDEEM_WINDOW_MS = 24 * 60 * 60 * 1000;

// Unambiguous alphabet (no 0/O/1/I) for human-readable, unpredictable codes.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const MAX_CODE_ATTEMPTS = 3;

export type RedeemResult =
	| { ok: true; reward: RewardItem; balance: number; code: string }
	| { ok: false; status: number; error: string };

export function findReward(id: unknown): RewardItem | null {
	if (typeof id !== 'string') return null;
	return REWARDS.find((reward) => reward.id === id) ?? null;
}

// SECURITY: cryptographically-random, unpredictable code (never derived from time/ids).
function generateRedemptionCode(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
	const body = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
	return `PURR-${body}`;
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

// SECURITY: per-user redeem rate limit; keyed by hashed user id so raw ids are never stored.
export async function checkRedeemRateLimit(input: {
	database: Database;
	userId: string;
	now?: number;
}): Promise<RateLimitDecision> {
	return checkRateLimit({
		database: input.database,
		key: await hashRateKey(input.userId),
		action: 'reward_redeem',
		limit: REDEEM_DAILY_LIMIT,
		windowMs: REDEEM_WINDOW_MS,
		now: input.now
	});
}

// Deducts points and persists a redemption atomically; costs/codes are server-owned.
export async function redeemReward(input: {
	database: Database;
	userId: string;
	rewardId: unknown;
	now?: number;
	// Overridable only for tests (e.g. forcing a code collision); production uses the crypto default.
	generateCode?: () => string;
}): Promise<RedeemResult> {
	const reward = findReward(input.rewardId);
	if (!reward) return { ok: false, status: 400, error: 'Choose a valid reward.' };

	// SECURITY: defense-in-depth — only coupon/vet/donation kinds may be redeemed for a code here.
	const item = findItem(reward.id);
	if (!item || !isRedeemableKind(item.kind))
		return { ok: false, status: 400, error: 'Choose a valid reward.' };

	const now = input.now ?? Date.now();
	const makeCode = input.generateCode ?? generateRedemptionCode;

	for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
		const code = makeCode();
		try {
			return await input.database.transaction(async (tx): Promise<RedeemResult> => {
				// SECURITY: conditional deduct guards against negative balance; 0 rows = not enough points.
				const rows = await tx
					.update(users)
					.set({ purrpoints: sql`${users.purrpoints} - ${reward.cost}` })
					.where(and(eq(users.id, input.userId), gte(users.purrpoints, reward.cost)))
					.returning({ balance: users.purrpoints });

				const balance = rows[0]?.balance;
				if (typeof balance !== 'number')
					return { ok: false, status: 409, error: 'Not enough Purrpoints.' };

				// Cost snapshot captured here so later catalog price changes never rewrite history.
				await tx.insert(rewardRedemptions).values({
					userId: input.userId,
					rewardId: reward.id,
					code,
					cost: reward.cost,
					createdAt: now
				});

				return { ok: true, reward, balance, code };
			});
		} catch (error) {
			// A code collision rolls the whole transaction back (no deduct, no orphan row); retry.
			if (isUniqueConflict(error) && attempt < MAX_CODE_ATTEMPTS - 1) continue;
			if (isUniqueConflict(error))
				return { ok: false, status: 503, error: 'Could not redeem right now. Please try again.' };
			throw error;
		}
	}

	// Unreachable: the loop either returns a result or throws a non-conflict error.
	return { ok: false, status: 503, error: 'Could not redeem right now. Please try again.' };
}
