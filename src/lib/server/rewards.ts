// SECURITY: server-owned reward catalog and redemption logic.
import { and, eq, gte, sql } from 'drizzle-orm';
import { users } from './db/schema';

type Database = typeof import('./db').db;

export type RewardItem = {
	id: string;
	title: string;
	cost: number;
	desc: string;
	category: 'vet' | 'treat' | 'toy' | 'shelter';
};

export const REWARDS: RewardItem[] = [
	{
		id: 'vet_discount',
		title: 'Vet Consultation Discount',
		cost: 100,
		desc: 'Get 25% off your next physical vet visit.',
		category: 'vet'
	},
	{
		id: 'cat_treats',
		title: 'Premium Tuna Treats',
		cost: 150,
		desc: 'All-natural freeze-dried tuna bites.',
		category: 'treat'
	},
	{
		id: 'feather_wand',
		title: 'Rainbow Feather Wand',
		cost: 200,
		desc: 'Interactive toy with a comfortable wooden handle.',
		category: 'toy'
	},
	{
		id: 'shelter_don',
		title: 'Feed a Shelter Kitty',
		cost: 100,
		desc: 'Donate daily meals to cat rescue shelters.',
		category: 'shelter'
	}
];

export type RedeemResult =
	| { ok: true; reward: RewardItem; balance: number; code: string }
	| { ok: false; status: number; error: string };

export function findReward(id: unknown): RewardItem | null {
	if (typeof id !== 'string') return null;
	return REWARDS.find((reward) => reward.id === id) ?? null;
}

export async function redeemReward(input: {
	database: Database;
	userId: string;
	rewardId: unknown;
	now?: number;
}): Promise<RedeemResult> {
	const reward = findReward(input.rewardId);
	if (!reward) return { ok: false, status: 400, error: 'Choose a valid reward.' };

	const rows = await input.database
		.update(users)
		.set({ purrpoints: sql`${users.purrpoints} - ${reward.cost}` })
		.where(and(eq(users.id, input.userId), gte(users.purrpoints, reward.cost)))
		.returning({ balance: users.purrpoints });

	const balance = rows[0]?.balance;
	if (typeof balance !== 'number')
		return { ok: false, status: 409, error: 'Not enough Purrpoints.' };

	const stamp = (input.now ?? Date.now()).toString(36).toUpperCase();
	return { ok: true, reward, balance, code: `PURR-${stamp.slice(-6)}` };
}
