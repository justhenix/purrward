// Coverage for daily coupon swap limiting after local validation.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './db/schema';
import { partners, rewardRedemptions } from './db/schema';
import { tradeCoupon } from './coupon-trade';

type Database = Parameters<typeof tradeCoupon>[0]['database'];

let client: Client;
let db: Database;
let dbPath: string;

async function seedPartner(): Promise<void> {
	await db.insert(partners).values({
		id: 'p1',
		name: 'Whiskers Veterinary Clinic',
		category: 'vet',
		address: '12 Tabby Lane',
		mapX: 210,
		mapY: 170,
		createdAt: Date.now()
	});
}

async function seedRedemption(id: string): Promise<void> {
	await db.insert(rewardRedemptions).values({
		id,
		userId: 'u1',
		rewardId: 'vet_discount',
		code: `PURR-${id}`,
		cost: 100,
		status: 'active',
		createdAt: Date.now()
	});
}

beforeEach(async () => {
	dbPath = join(tmpdir(), `purrward-coupon-${crypto.randomUUID()}.db`);
	client = createClient({ url: `file:${dbPath.replace(/\\/g, '/')}` });
	await client.batch(
		[
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
			`CREATE TABLE partners (
				id text PRIMARY KEY NOT NULL,
				name text NOT NULL,
				category text NOT NULL,
				address text NOT NULL,
				map_x integer NOT NULL,
				map_y integer NOT NULL,
				created_at integer NOT NULL
			)`,
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
	db = drizzle(client, { schema }) as unknown as Database;
});

afterEach(() => {
	client.close();
	try {
		rmSync(dbPath, { force: true });
	} catch {
		// Windows may still hold the file handle briefly; temp files are cleaned by the OS.
	}
});

describe('tradeCoupon daily limit', () => {
	it('allows one coupon swap per day', async () => {
		const now = Date.UTC(2026, 6, 7);
		await seedPartner();
		await seedRedemption('r1');
		await seedRedemption('r2');

		const first = await tradeCoupon({
			database: db,
			userId: 'u1',
			redemptionId: 'r1',
			partnerId: 'p1',
			dailyLimit: 1,
			now
		});
		expect(first).toMatchObject({ ok: true, redemptionId: 'r1', partnerId: 'p1' });

		const second = await tradeCoupon({
			database: db,
			userId: 'u1',
			redemptionId: 'r2',
			partnerId: 'p1',
			dailyLimit: 1,
			now
		});
		expect(second).toMatchObject({ ok: false, status: 429 });
		if (!second.ok) expect(second.retryAfter).toBeGreaterThan(0);
	});

	it('does not spend the daily swap on an invalid partner', async () => {
		const now = Date.UTC(2026, 6, 7);
		await seedPartner();
		await seedRedemption('r1');

		const invalid = await tradeCoupon({
			database: db,
			userId: 'u1',
			redemptionId: 'r1',
			partnerId: 'missing',
			dailyLimit: 1,
			now
		});
		expect(invalid).toMatchObject({ ok: false, status: 400 });

		const valid = await tradeCoupon({
			database: db,
			userId: 'u1',
			redemptionId: 'r1',
			partnerId: 'p1',
			dailyLimit: 1,
			now
		});
		expect(valid).toMatchObject({ ok: true, redemptionId: 'r1' });
	});
});
