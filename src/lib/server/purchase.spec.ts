// Coverage for T5: server-owned direct purchase into account-wide inventory.
// T5 = direct item purchase endpoint (see ticket legend in db/schema.ts).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema';
import { userInventory, users } from './db/schema';
import { PURCHASE_DAILY_LIMIT, checkPurchaseRateLimit, purchaseItem } from './purchase';
import { findItem } from './catalog';
import { POST } from '../../routes/api/shop/purchase/+server';
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

async function balanceOf(id: string): Promise<number | null> {
	const rows = await db
		.select({ purrpoints: users.purrpoints })
		.from(users)
		.where(eq(users.id, id));
	return rows[0]?.purrpoints ?? null;
}

async function inventoryCount(userId: string): Promise<number> {
	const rows = await db.select().from(userInventory).where(eq(userInventory.userId, userId));
	return rows.length;
}

beforeEach(async () => {
	// libsql ':memory:' does not persist tables across connections; use a temp file db.
	dbPath = join(tmpdir(), `purrward-purchase-${crypto.randomUUID()}.db`);
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
			`CREATE TABLE user_inventory (
				id text PRIMARY KEY NOT NULL,
				user_id text NOT NULL,
				item_id text NOT NULL,
				kind text NOT NULL,
				source text NOT NULL,
				acquired_at integer NOT NULL
			)`,
			`CREATE UNIQUE INDEX user_inventory_user_item_idx ON user_inventory (user_id, item_id)`,
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

describe('purchaseItem', () => {
	it('buys an accessory: deducts cost and writes one inventory row matching the returned item', async () => {
		await seedUser('u1', 100);
		const result = await purchaseItem({ database: db, userId: 'u1', itemId: 'acc_bowtie' });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.balance).toBe(40); // 100 - 60

		const rows = await db.select().from(userInventory).where(eq(userInventory.userId, 'u1'));
		expect(rows).toHaveLength(1);
		expect(rows[0]?.itemId).toBe(result.item.id);
		expect(rows[0]?.kind).toBe(result.item.kind);
		expect(rows[0]?.source).toBe('purchase');
		expect(await balanceOf('u1')).toBe(40);
	});

	it('buys a background: deducts cost and writes one inventory row', async () => {
		await seedUser('u1', 100);
		const result = await purchaseItem({ database: db, userId: 'u1', itemId: 'bg_park' });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.balance).toBe(20); // 100 - 80
		const rows = await db.select().from(userInventory).where(eq(userInventory.userId, 'u1'));
		expect(rows).toHaveLength(1);
		expect(rows[0]?.itemId).toBe('bg_park');
		expect(rows[0]?.source).toBe('purchase');
	});

	it('returns 409 on insufficient balance with no write and no deduction', async () => {
		await seedUser('u1', 10);
		const result = await purchaseItem({ database: db, userId: 'u1', itemId: 'acc_bowtie' });
		expect(result).toMatchObject({ ok: false, status: 409 });
		expect(await balanceOf('u1')).toBe(10);
		expect(await inventoryCount('u1')).toBe(0);
	});

	it('returns 409 when the item is already owned, with no deduction', async () => {
		await seedUser('u1', 100);
		await ownItem('u1', 'acc_bowtie');
		const result = await purchaseItem({ database: db, userId: 'u1', itemId: 'acc_bowtie' });
		expect(result).toMatchObject({ ok: false, status: 409 });
		expect(await balanceOf('u1')).toBe(100);
		expect(await inventoryCount('u1')).toBe(1);
	});

	it('rejects an unknown item id with 400', async () => {
		await seedUser('u1', 500);
		const result = await purchaseItem({ database: db, userId: 'u1', itemId: 'acc_unknown' });
		expect(result).toMatchObject({ ok: false, status: 400 });
		expect(await inventoryCount('u1')).toBe(0);
	});

	it('refuses coupon/vet/donation items (not purchasable here)', async () => {
		await seedUser('u1', 500);
		for (const itemId of ['vet_discount', 'cat_treats', 'shelter_don']) {
			const result = await purchaseItem({ database: db, userId: 'u1', itemId });
			expect(result).toMatchObject({ ok: false, status: 400 });
		}
		expect(await balanceOf('u1')).toBe(500);
		expect(await inventoryCount('u1')).toBe(0);
	});

	it('refuses a gacha-pool pseudo id and the free default background', async () => {
		await seedUser('u1', 500);
		// No such purchasable pseudo item exists in the catalog.
		expect(await purchaseItem({ database: db, userId: 'u1', itemId: 'gacha' })).toMatchObject({
			ok: false,
			status: 400
		});
		// The free default background is not for sale (cost 0).
		expect(await purchaseItem({ database: db, userId: 'u1', itemId: 'bg_home' })).toMatchObject({
			ok: false,
			status: 400
		});
		expect(await inventoryCount('u1')).toBe(0);
	});

	it('is safe on repeat: second buy of the same item is a clean 409, no double-spend or orphan', async () => {
		await seedUser('u1', 200);
		const first = await purchaseItem({ database: db, userId: 'u1', itemId: 'acc_bowtie' });
		expect(first.ok).toBe(true);
		expect(await balanceOf('u1')).toBe(140);

		const second = await purchaseItem({ database: db, userId: 'u1', itemId: 'acc_bowtie' });
		expect(second).toMatchObject({ ok: false, status: 409 });
		// Deducted once, exactly one row.
		expect(await balanceOf('u1')).toBe(140);
		expect(await inventoryCount('u1')).toBe(1);
	});
});

describe('checkPurchaseRateLimit', () => {
	it('allows up to the daily limit, then blocks', async () => {
		const now = 1_000_000;
		for (let i = 0; i < PURCHASE_DAILY_LIMIT; i += 1) {
			const decision = await checkPurchaseRateLimit({ database: db, userId: 'u1', now });
			expect(decision.allowed).toBe(true);
		}
		const blocked = await checkPurchaseRateLimit({ database: db, userId: 'u1', now });
		expect(blocked.allowed).toBe(false);
		expect(blocked.retryAfter).toBeGreaterThan(0);
	});
});

describe('purchase endpoint sandbox path', () => {
	it('returns a fake success without touching the database', async () => {
		const formData = new FormData();
		formData.set('itemId', 'acc_bowtie');

		// No db is provided; a sandbox request must never reach a DB import or write.
		const response = await POST({
			locals: { user: { id: 'u1' } },
			request: { formData: async () => formData },
			cookies: { get: () => '1:1:initial:0800' }
		} as unknown as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		const body = (await response.json()) as { item: { id: string }; balance: number };
		expect(body.item.id).toBe('acc_bowtie');
		expect(body.balance).toBe(SANDBOX_BALANCE);
	});
});
