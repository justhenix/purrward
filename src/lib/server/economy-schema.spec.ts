// Schema-shape coverage for the T1 economy tables using an in-memory libsql database.
// T1 = economy schema + unified catalog + allowlists (see the ticket legend in db/schema.ts).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema';
import { cats, rewardRedemptions, userInventory, users } from './db/schema';

type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: Client;
let db: Database;
let dbPath: string;

async function seedUser(id: string): Promise<void> {
	await db.insert(users).values({
		id,
		email: `${id}@example.com`,
		purrpoints: 0,
		createdAt: Date.now()
	} as typeof users.$inferInsert);
}

beforeEach(async () => {
	// libsql ':memory:' does not persist tables across connections; use a temp file db.
	dbPath = join(tmpdir(), `purrward-economy-${crypto.randomUUID()}.db`);
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
			`CREATE TABLE cats (
				id text PRIMARY KEY NOT NULL,
				user_id text NOT NULL,
				name text NOT NULL,
				care_mode text NOT NULL,
				avatar_id text NOT NULL,
				purrpoints integer DEFAULT 0 NOT NULL,
				equipped_accessory_id text,
				background_id text,
				created_at integer NOT NULL
			)`,
			`CREATE TABLE user_inventory (
				id text PRIMARY KEY NOT NULL,
				user_id text NOT NULL,
				item_id text NOT NULL,
				kind text NOT NULL,
				source text NOT NULL,
				acquired_at integer NOT NULL
			)`,
			`CREATE UNIQUE INDEX user_inventory_user_item_idx ON user_inventory (user_id, item_id)`,
			`CREATE TABLE reward_redemptions (
				id text PRIMARY KEY NOT NULL,
				user_id text NOT NULL,
				reward_id text NOT NULL,
				code text NOT NULL,
				cost integer NOT NULL,
				status text DEFAULT 'active' NOT NULL,
				created_at integer NOT NULL
			)`,
			`CREATE UNIQUE INDEX reward_redemptions_code_unique ON reward_redemptions (code)`
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

describe('user_inventory ownership', () => {
	it('allows a user to own two different items', async () => {
		await seedUser('u1');
		await db.insert(userInventory).values([
			{ userId: 'u1', itemId: 'acc_bowtie', kind: 'accessory', source: 'gacha', acquiredAt: 1 },
			{ userId: 'u1', itemId: 'acc_scarf', kind: 'accessory', source: 'purchase', acquiredAt: 2 }
		]);
		const rows = await db.select().from(userInventory).where(eq(userInventory.userId, 'u1'));
		expect(rows).toHaveLength(2);
	});

	it('rejects a duplicate (userId, itemId) pair', async () => {
		await seedUser('u1');
		await db.insert(userInventory).values({
			userId: 'u1',
			itemId: 'acc_bowtie',
			kind: 'accessory',
			source: 'gacha',
			acquiredAt: 1
		});

		let threw = false;
		try {
			await db.insert(userInventory).values({
				userId: 'u1',
				itemId: 'acc_bowtie',
				kind: 'accessory',
				source: 'purchase',
				acquiredAt: 2
			});
		} catch {
			threw = true;
		}
		expect(threw).toBe(true);
	});

	it('allows the same item id for two different users', async () => {
		await seedUser('u1');
		await seedUser('u2');
		await db.insert(userInventory).values({
			userId: 'u1',
			itemId: 'acc_bowtie',
			kind: 'accessory',
			source: 'gacha',
			acquiredAt: 1
		});
		await db.insert(userInventory).values({
			userId: 'u2',
			itemId: 'acc_bowtie',
			kind: 'accessory',
			source: 'gacha',
			acquiredAt: 1
		});

		const all = await db.select().from(userInventory);
		expect(all).toHaveLength(2);
	});
});

describe('reward_redemptions codes', () => {
	it('rejects a duplicate code', async () => {
		await seedUser('u1');
		await db.insert(rewardRedemptions).values({
			userId: 'u1',
			rewardId: 'vet_discount',
			code: 'PURR-ABC123',
			cost: 100,
			createdAt: 1
		});

		let threw = false;
		try {
			await db.insert(rewardRedemptions).values({
				userId: 'u1',
				rewardId: 'cat_treats',
				code: 'PURR-ABC123',
				cost: 150,
				createdAt: 2
			});
		} catch {
			threw = true;
		}
		expect(threw).toBe(true);
	});
});

describe('cats equip fields', () => {
	it('defaults equippedAccessoryId and backgroundId to null on a new row', async () => {
		await seedUser('u1');
		await db.insert(cats).values({
			id: 'c1',
			userId: 'u1',
			name: 'Mochi',
			careMode: 'owned',
			avatarId: 'orange',
			purrpoints: 0,
			createdAt: 1
		});

		const rows = await db.select().from(cats).where(eq(cats.id, 'c1'));
		expect(rows[0]?.equippedAccessoryId).toBeNull();
		expect(rows[0]?.backgroundId).toBeNull();
	});
});
