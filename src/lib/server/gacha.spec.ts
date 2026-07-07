// Coverage for T3: server-owned gacha pull into account-wide inventory.
// T3 = gacha pull endpoint (see ticket legend in db/schema.ts).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema';
import { userInventory, users } from './db/schema';
import { GACHA_DAILY_LIMIT, GACHA_DUPLICATE_REFUND, checkGachaRateLimit, pullGacha } from './gacha';
import { GACHA_POOL, findItem } from './catalog';
import { POST } from '../../routes/api/gacha/pull/+server';
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
		source: 'gacha',
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
	dbPath = join(tmpdir(), `purrward-gacha-${crypto.randomUUID()}.db`);
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

describe('pullGacha', () => {
	it('deducts 30 and writes exactly one inventory row matching the returned item', async () => {
		await seedUser('u1', 100);
		const result = await pullGacha({ database: db, userId: 'u1' });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.balance).toBe(70);

		const rows = await db.select().from(userInventory).where(eq(userInventory.userId, 'u1'));
		expect(rows).toHaveLength(1);
		expect(rows[0]?.itemId).toBe(result.item.id);
		expect(rows[0]?.source).toBe('gacha');
		expect(rows[0]?.kind).toBe(result.item.kind);
		expect(await balanceOf('u1')).toBe(70);
	});

	it('only ever grants gacha-eligible items', async () => {
		await seedUser('u1', 1000);
		const granted = new Set<string>();
		for (let i = 0; i < GACHA_POOL.length; i += 1) {
			const result = await pullGacha({
				database: db,
				userId: 'u1',
				pick: (pool) => pool[i] ?? pool[0]
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(findItem(result.item.id)?.gacha).toBe(true);
				granted.add(result.item.id);
			}
		}
		// Every distinct pool item was granted exactly once.
		expect(granted).toEqual(new Set(GACHA_POOL.map((item) => item.id)));
	});

	it('refunds a duplicate cosmetic without adding inventory', async () => {
		await seedUser('u1', 100);
		await ownItem('u1', 'acc_bandana');
		const bandana = findItem('acc_bandana');
		if (!bandana) throw new Error('setup failed');
		const result = await pullGacha({ database: db, userId: 'u1', pick: () => bandana });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.item.id).toBe('acc_bandana');
		expect(result.duplicate).toBe(true);
		expect(result.refund).toBe(GACHA_DUPLICATE_REFUND);
		expect(result.balance).toBe(75);
		expect(await balanceOf('u1')).toBe(75);
		expect(await inventoryCount('u1')).toBe(1);
	});

	it('still allows a duplicate pull when the whole pool is owned', async () => {
		await seedUser('u1', 100);
		for (const item of GACHA_POOL) await ownItem('u1', item.id);

		const result = await pullGacha({ database: db, userId: 'u1', pick: (pool) => pool[0] });
		expect(result).toMatchObject({
			ok: true,
			duplicate: true,
			refund: GACHA_DUPLICATE_REFUND
		});
		expect(await balanceOf('u1')).toBe(75);
		expect(await inventoryCount('u1')).toBe(GACHA_POOL.length);
	});

	it('returns 409 on insufficient balance with no inventory write', async () => {
		await seedUser('u1', 10);
		const result = await pullGacha({ database: db, userId: 'u1' });
		expect(result).toMatchObject({ ok: false, status: 409 });
		expect(await balanceOf('u1')).toBe(10);
		expect(await inventoryCount('u1')).toBe(0);
	});

	it('handles a known duplicate safely: no extra inventory row', async () => {
		await seedUser('u1', 100);
		await ownItem('u1', 'acc_bandana'); // 1 owned row, balance still 100
		const bandana = findItem('acc_bandana');
		if (!bandana) throw new Error('setup failed');
		const result = await pullGacha({ database: db, userId: 'u1', pick: () => bandana });

		expect(result).toMatchObject({ ok: true, duplicate: true });
		expect(await balanceOf('u1')).toBe(75);
		expect(await inventoryCount('u1')).toBe(1);
	});
});

describe('checkGachaRateLimit', () => {
	it('allows up to the daily limit, then blocks', async () => {
		const now = 1_000_000;
		for (let i = 0; i < GACHA_DAILY_LIMIT; i += 1) {
			const decision = await checkGachaRateLimit({ database: db, userId: 'u1', now });
			expect(decision.allowed).toBe(true);
		}
		const blocked = await checkGachaRateLimit({ database: db, userId: 'u1', now });
		expect(blocked.allowed).toBe(false);
		expect(blocked.retryAfter).toBeGreaterThan(0);
	});
});

describe('gacha endpoint sandbox path', () => {
	it('returns a fake gacha item without touching the database', async () => {
		// No db is provided; a sandbox request must never reach a DB import or write.
		const response = await POST({
			locals: { user: { id: 'u1' } },
			cookies: { get: () => '1:1:initial:0800' }
		} as unknown as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			item: { id: string };
			balance: number;
			duplicate: boolean;
			refund: number;
		};
		expect(findItem(body.item.id)?.gacha).toBe(true);
		expect(body.balance).toBe(SANDBOX_BALANCE);
		expect(body.duplicate).toBe(false);
		expect(body.refund).toBe(0);
	});
});
