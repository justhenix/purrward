// Coverage for T2: persistent redemption + per-user redeem rate limit.
// T2 = persist redemptions to reward_redemptions + rate-limit redeem (see ticket legend in db/schema.ts).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema';
import { rewardRedemptions, users } from './db/schema';
import {
	REDEEM_DAILY_LIMIT,
	checkRedeemRateLimit,
	redeemReward,
	type RedeemResult
} from './rewards';
import { POST } from '../../routes/api/rewards/redeem/+server';
import { SANDBOX_BALANCE } from './sandbox';

type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: Client;
let db: Database;
let dbPath: string;

async function seedUser(id: string, purrpoints: number): Promise<void> {
	await db.insert(users).values({
		id,
		email: `${id}@example.com`,
		purrpoints,
		createdAt: Date.now()
	} as typeof users.$inferInsert);
}

async function balanceOf(id: string): Promise<number | null> {
	const rows = await db
		.select({ purrpoints: users.purrpoints })
		.from(users)
		.where(eq(users.id, id));
	return rows[0]?.purrpoints ?? null;
}

async function redemptionCount(): Promise<number> {
	const rows = await db.select().from(rewardRedemptions);
	return rows.length;
}

beforeEach(async () => {
	// libsql ':memory:' does not persist tables across connections; use a temp file db.
	dbPath = join(tmpdir(), `purrward-rewards-${crypto.randomUUID()}.db`);
	client = createClient({ url: `file:${dbPath.replace(/\\/g, '/')}` });
	await client.batch(
		[
			`CREATE TABLE users (
				id text PRIMARY KEY NOT NULL,
				google_sub text,
				email text NOT NULL,
				display_name text,
				avatar_url text,
				purrpoints integer DEFAULT 0,
				active_cat_id text,
				created_at integer NOT NULL
			)`,
			`CREATE TABLE reward_redemptions (
				id text PRIMARY KEY NOT NULL,
				user_id text NOT NULL,
				reward_id text NOT NULL,
				code text NOT NULL,
				cost integer NOT NULL,
				status text DEFAULT 'active' NOT NULL,
				used_at integer,
				partner_id text,
				created_at integer NOT NULL
			)`,
			`CREATE UNIQUE INDEX reward_redemptions_code_unique ON reward_redemptions (code)`,
			`CREATE TABLE rate_limits (
				id text PRIMARY KEY NOT NULL,
				key text NOT NULL,
				action text NOT NULL,
				window_start integer NOT NULL,
				count integer NOT NULL,
				updated_at integer NOT NULL
			)`
		],
		'write'
	);
	db = drizzle(client, { schema });
});

afterEach(() => {
	client.close();
	try {
		rmSync(dbPath, { force: true });
	} catch {
		// Windows may still hold the file handle briefly; temp files are cleaned by the OS.
	}
});

describe('redeemReward', () => {
	it('deducts points and writes exactly one redemption with matching, snapshotted code', async () => {
		await seedUser('u1', 200);
		const result = await redeemReward({ database: db, userId: 'u1', rewardId: 'vet_discount' });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.balance).toBe(100);

		const rows = await db.select().from(rewardRedemptions);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.userId).toBe('u1');
		expect(rows[0]?.rewardId).toBe('vet_discount');
		// Returned code is the persisted code.
		expect(rows[0]?.code).toBe(result.code);
		// Cost snapshot equals the catalog cost.
		expect(rows[0]?.cost).toBe(100);
		expect(await balanceOf('u1')).toBe(100);
	});

	it('returns 409 on insufficient balance with no deduction and no row', async () => {
		await seedUser('u1', 50);
		const result = await redeemReward({ database: db, userId: 'u1', rewardId: 'vet_discount' });

		expect(result).toMatchObject({ ok: false, status: 409 });
		expect(await balanceOf('u1')).toBe(50);
		expect(await redemptionCount()).toBe(0);
	});

	it('rejects an unknown reward id with 400', async () => {
		await seedUser('u1', 500);
		const result = await redeemReward({ database: db, userId: 'u1', rewardId: 'not_a_reward' });
		expect(result).toMatchObject({ ok: false, status: 400 });
		expect(await redemptionCount()).toBe(0);
	});

	it('rejects non-string reward ids with 400', async () => {
		await seedUser('u1', 500);
		const result = await redeemReward({ database: db, userId: 'u1', rewardId: 42 });
		expect(result).toMatchObject({ ok: false, status: 400 });
	});

	it('refuses accessory/background/gacha item ids (not redeemable here)', async () => {
		await seedUser('u1', 500);
		for (const itemId of ['acc_bowtie', 'bg_park', 'acc_crown']) {
			const result = await redeemReward({ database: db, userId: 'u1', rewardId: itemId });
			expect(result).toMatchObject({ ok: false, status: 400 });
		}
		expect(await balanceOf('u1')).toBe(500);
		expect(await redemptionCount()).toBe(0);
	});

	it('still redeems every legacy reward id at its unchanged cost', async () => {
		const cases: [string, number][] = [
			['vet_discount', 100],
			['cat_treats', 150],
			['feather_wand', 200],
			['shelter_don', 200]
		];
		for (const [rewardId, cost] of cases) {
			await seedUser(rewardId, cost);
			const result = await redeemReward({ database: db, userId: rewardId, rewardId });
			expect(result.ok).toBe(true);
			if (result.ok) expect(result.balance).toBe(0);
			const rows = await db
				.select()
				.from(rewardRedemptions)
				.where(eq(rewardRedemptions.userId, rewardId));
			expect(rows[0]?.cost).toBe(cost);
		}
	});

	it('handles a code collision safely: no double-spend, no orphan row', async () => {
		await seedUser('u1', 500);
		// Force every attempt to use the same code so the second redeem always collides.
		const generateCode = () => 'PURR-SAMECODE';

		const first = await redeemReward({
			database: db,
			userId: 'u1',
			rewardId: 'vet_discount',
			generateCode
		});
		expect(first.ok).toBe(true);
		expect(await balanceOf('u1')).toBe(400);

		const second: RedeemResult = await redeemReward({
			database: db,
			userId: 'u1',
			rewardId: 'vet_discount',
			generateCode
		});
		expect(second).toMatchObject({ ok: false, status: 503 });
		// The collided redeem rolled back: balance unchanged and still exactly one persisted row.
		expect(await balanceOf('u1')).toBe(400);
		expect(await redemptionCount()).toBe(1);
	});
});

describe('checkRedeemRateLimit', () => {
	it('allows up to the daily limit, then blocks', async () => {
		const now = 1_000_000;
		for (let i = 0; i < REDEEM_DAILY_LIMIT; i += 1) {
			const decision = await checkRedeemRateLimit({ database: db, userId: 'u1', now });
			expect(decision.allowed).toBe(true);
		}
		const blocked = await checkRedeemRateLimit({ database: db, userId: 'u1', now });
		expect(blocked.allowed).toBe(false);
		expect(blocked.retryAfter).toBeGreaterThan(0);
	});
});

describe('redeem endpoint sandbox path', () => {
	it('returns a fake code without touching the database', async () => {
		const formData = new FormData();
		formData.set('rewardId', 'vet_discount');

		// No db is provided; a sandbox request must never reach a DB import or write.
		const response = await POST({
			locals: { user: { id: 'u1' } },
			request: { formData: async () => formData },
			cookies: { get: () => '1:1:initial:0800' }
		} as unknown as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		const body = (await response.json()) as { code: string; balance: number };
		expect(body.code.startsWith('SANDBOX-')).toBe(true);
		expect(body.balance).toBe(SANDBOX_BALANCE);
	});
});
