// Coverage for T4: account-wide inventory ownership + per-cat equip.
// T4 = inventory + equip endpoint (see ticket legend in db/schema.ts).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema';
import { cats, userInventory, users } from './db/schema';
import { equipItem, listEquippedAccessories } from './inventory';
import { findItem } from './catalog';

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

async function seedCat(id: string, userId: string): Promise<void> {
	await db.insert(cats).values({
		id,
		userId,
		name: `Cat ${id}`,
		careMode: 'owned',
		avatarId: 'orange',
		purrpoints: 0,
		createdAt: Date.now()
	});
}

async function ownItem(userId: string, itemId: string): Promise<void> {
	const item = findItem(itemId);
	await db.insert(userInventory).values({
		userId,
		itemId,
		kind: item?.kind ?? 'accessory',
		source: 'purchase',
		acquiredAt: 1
	});
}

async function equipStateOf(catId: string): Promise<{
	equippedAccessoryId: string | null;
	backgroundId: string | null;
}> {
	const rows = await db
		.select({ equippedAccessoryId: cats.equippedAccessoryId, backgroundId: cats.backgroundId })
		.from(cats)
		.where(eq(cats.id, catId));
	return {
		equippedAccessoryId: rows[0]?.equippedAccessoryId ?? null,
		backgroundId: rows[0]?.backgroundId ?? null
	};
}

beforeEach(async () => {
	// libsql ':memory:' does not persist tables across connections; use a temp file db.
	dbPath = join(tmpdir(), `purrward-inventory-${crypto.randomUUID()}.db`);
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
			`CREATE TABLE cat_equipped_cosmetics (
				id text PRIMARY KEY NOT NULL,
				user_id text NOT NULL,
				cat_id text NOT NULL,
				slot text NOT NULL,
				item_id text NOT NULL,
				equipped_at integer NOT NULL
			)`,
			`CREATE UNIQUE INDEX cat_equipped_cosmetics_cat_slot_idx ON cat_equipped_cosmetics (cat_id, slot)`
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

describe('equipItem', () => {
	it('equips an owned accessory onto an owned cat', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		await ownItem('u1', 'acc_bandana');

		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'accessory',
			itemId: 'acc_bandana'
		});

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.equippedAccessoryId).toBe('acc_bandana');
		expect((await equipStateOf('c1')).equippedAccessoryId).toBe('acc_bandana');
	});

	it('equips one accessory per catalog slot', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		await ownItem('u1', 'acc_bucket_hat');
		await ownItem('u1', 'acc_nerd_glasses');

		expect(
			await equipItem({
				database: db,
				userId: 'u1',
				catId: 'c1',
				slot: 'head',
				itemId: 'acc_bucket_hat'
			})
		).toMatchObject({ ok: true });
		expect(
			await equipItem({
				database: db,
				userId: 'u1',
				catId: 'c1',
				slot: 'face',
				itemId: 'acc_nerd_glasses'
			})
		).toMatchObject({ ok: true });

		expect(await listEquippedAccessories(db, 'u1', 'c1')).toEqual([
			{ slot: 'head', itemId: 'acc_bucket_hat', assetId: 'bucket_hat' },
			{ slot: 'face', itemId: 'acc_nerd_glasses', assetId: 'nerd_glasses' }
		]);
	});

	it('equips an owned background onto an owned cat', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		await ownItem('u1', 'bg_park');

		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'background',
			itemId: 'bg_park'
		});

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.backgroundId).toBe('bg_park');
		expect((await equipStateOf('c1')).backgroundId).toBe('bg_park');
	});

	it('unequips the accessory slot when itemId is null', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		await ownItem('u1', 'acc_bandana');
		await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'accessory',
			itemId: 'acc_bandana'
		});

		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'accessory',
			itemId: null
		});

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.equippedAccessoryId).toBeNull();
		expect((await equipStateOf('c1')).equippedAccessoryId).toBeNull();
	});

	it('unequips the background slot when itemId is null', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		await ownItem('u1', 'bg_park');
		await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'background',
			itemId: 'bg_park'
		});

		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'background',
			itemId: null
		});

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.backgroundId).toBeNull();
		expect((await equipStateOf('c1')).backgroundId).toBeNull();
	});

	it('null itemId skips the ownership check (unequip without owning anything)', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		// u1 owns nothing.
		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'accessory',
			itemId: null
		});
		expect(result.ok).toBe(true);
	});

	it('rejects equipping onto a foreign cat with 403', async () => {
		await seedUser('u1');
		await seedUser('u2');
		await seedCat('c2', 'u2');
		await ownItem('u1', 'acc_bandana');

		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c2',
			slot: 'accessory',
			itemId: 'acc_bandana'
		});
		expect(result).toMatchObject({ ok: false, status: 403 });
		expect((await equipStateOf('c2')).equippedAccessoryId).toBeNull();
	});

	it('rejects an unowned accessory with 403', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'accessory',
			itemId: 'acc_bandana'
		});
		expect(result).toMatchObject({ ok: false, status: 403 });
		expect((await equipStateOf('c1')).equippedAccessoryId).toBeNull();
	});

	it('rejects an unowned background with 403', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'background',
			itemId: 'bg_park'
		});
		expect(result).toMatchObject({ ok: false, status: 403 });
	});

	it('rejects an unknown item id with 400', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'accessory',
			itemId: 'acc_unknown'
		});
		expect(result).toMatchObject({ ok: false, status: 400 });
	});

	it('rejects a wrong-slot item even when owned (no cross-slot equipping)', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		await ownItem('u1', 'bg_park');
		await ownItem('u1', 'acc_bandana');

		// Background id into the accessory slot.
		const intoAccessory = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'accessory',
			itemId: 'bg_park'
		});
		expect(intoAccessory).toMatchObject({ ok: false, status: 400 });

		// Accessory id into the background slot.
		const intoBackground = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'background',
			itemId: 'acc_bandana'
		});
		expect(intoBackground).toMatchObject({ ok: false, status: 400 });

		const state = await equipStateOf('c1');
		expect(state.equippedAccessoryId).toBeNull();
		expect(state.backgroundId).toBeNull();
	});

	it('rejects an invalid slot with 400', async () => {
		await seedUser('u1');
		await seedCat('c1', 'u1');
		const result = await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'hat',
			itemId: null
		});
		expect(result).toMatchObject({ ok: false, status: 400 });
	});

	it('updates only the owned cat, never another user cat', async () => {
		await seedUser('u1');
		await seedUser('u2');
		await seedCat('c1', 'u1');
		await seedCat('c2', 'u2');
		await ownItem('u1', 'acc_bandana');

		await equipItem({
			database: db,
			userId: 'u1',
			catId: 'c1',
			slot: 'accessory',
			itemId: 'acc_bandana'
		});

		expect((await equipStateOf('c1')).equippedAccessoryId).toBe('acc_bandana');
		// The other user's cat is untouched.
		expect((await equipStateOf('c2')).equippedAccessoryId).toBeNull();
	});
});
