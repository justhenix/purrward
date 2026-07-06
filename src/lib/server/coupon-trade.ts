// SECURITY: server-owned coupon redemption -> used state transition.
import { and, desc, eq } from 'drizzle-orm';
import { rewardRedemptions } from './db/schema';
import { findPartner } from '$lib/server/partners';
import { findReward } from '$lib/server/rewards';

type Database = typeof import('./db').db;

export type TradeResult =
	| { ok: true; redemptionId: string; partnerId: string; status: 'used' }
	| { ok: false; status: number; error: string };

// SECURITY: status transition + ownership + partner validity are all server-enforced.
export async function tradeCoupon(input: {
	database: Database;
	userId: string;
	redemptionId: unknown;
	partnerId: unknown;
	now?: number;
}): Promise<TradeResult> {
	const { database, userId } = input;

	// Narrow untrusted client-supplied ids to strings before any DB work.
	if (typeof input.redemptionId !== 'string' || typeof input.partnerId !== 'string') {
		return { ok: false, status: 400, error: 'Invalid trade request.' };
	}
	const redemptionId = input.redemptionId;
	const partnerId = input.partnerId;

	// SECURITY: the redeeming partner must exist before we mark a coupon used.
	const partner = await findPartner(database, partnerId);
	if (!partner) {
		return { ok: false, status: 400, error: 'Choose a valid partner.' };
	}

	const now = input.now ?? Date.now();

	// SECURITY: single conditional UPDATE guarantees the active->used transition is
	// atomic and scoped to the owner; a non-owner or non-active row matches zero rows.
	const updated = await database
		.update(rewardRedemptions)
		.set({ status: 'used', usedAt: now, partnerId })
		.where(
			and(
				eq(rewardRedemptions.id, redemptionId),
				eq(rewardRedemptions.userId, userId),
				eq(rewardRedemptions.status, 'active')
			)
		)
		.returning({ id: rewardRedemptions.id });

	if (updated.length > 0) {
		return { ok: true, redemptionId, partnerId, status: 'used' };
	}

	// SECURITY: zero rows updated is ambiguous — disambiguate ownership vs status with a
	// follow-up read so we never leak another user's redemptions as a conflict.
	const existing = await database
		.select({
			userId: rewardRedemptions.userId,
			status: rewardRedemptions.status
		})
		.from(rewardRedemptions)
		.where(eq(rewardRedemptions.id, redemptionId))
		.limit(1);

	const row = existing[0];
	if (!row || row.userId !== userId) {
		return { ok: false, status: 403, error: 'You cannot trade this coupon.' };
	}

	return { ok: false, status: 409, error: 'This coupon has already been used.' };
}

// A user's redemption joined with its catalog reward title for the history view.
export type RedemptionRow = {
	id: string;
	rewardId: string;
	title: string;
	code: string;
	status: string;
	partnerId: string | null;
	usedAt: number | null;
	createdAt: number;
};

// Lists a single user's redemptions newest-first; title is resolved from the catalog by rewardId.
export async function listRedemptions(
	database: Database,
	userId: string
): Promise<RedemptionRow[]> {
	const rows = await database
		.select({
			id: rewardRedemptions.id,
			rewardId: rewardRedemptions.rewardId,
			code: rewardRedemptions.code,
			status: rewardRedemptions.status,
			partnerId: rewardRedemptions.partnerId,
			usedAt: rewardRedemptions.usedAt,
			createdAt: rewardRedemptions.createdAt
		})
		.from(rewardRedemptions)
		.where(eq(rewardRedemptions.userId, userId))
		.orderBy(desc(rewardRedemptions.createdAt));

	return rows.map((row) => ({
		...row,
		// Fall back to the raw rewardId when the catalog no longer carries the reward.
		title: findReward(row.rewardId)?.title ?? row.rewardId
	}));
}
