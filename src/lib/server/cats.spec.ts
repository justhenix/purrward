// Coverage for the owner-scoped cat manager using an in-memory libsql database.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema';
import { users } from './db/schema';
import {
	CAT_CAP,
	createCat,
	getActiveCat,
	getOrCreateDefaultCat,
	listCats,
	removeCat,
	requireCatOwnership,
	setActiveCat
} from './cats';

type Database = Parameters<typeof listCats>[0];

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
	dbPath = join(tmpdir(), `purrward-cats-${crypto.randomUUID()}.db`);
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
			`CREATE TABLE habit_completions (
				id text PRIMARY KEY NOT NULL,
				user_id text NOT NULL,
				cat_id text,
				task_type text NOT NULL,
				verified integer NOT NULL,
				points_awarded integer DEFAULT 0 NOT NULL,
				reason text NOT NULL,
				day_start integer DEFAULT 0 NOT NULL,
				created_at integer NOT NULL
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

describe('createCat', () => {
	it('creates a valid owned cat and sets it active', async () => {
		await seedUser('u1');
		const result = await createCat(db, 'u1', { name: '  Luna  ', avatarId: 'orange' });

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.name).toBe('Luna');
			expect(result.value.careMode).toBe('owned');
		}
		const active = await getActiveCat(db, 'u1');
		expect(active?.name).toBe('Luna');
	});

	it('rejects an empty name without creating a cat', async () => {
		await seedUser('u1');
		const result = await createCat(db, 'u1', { name: '   ', avatarId: 'orange' });
		expect(result).toMatchObject({ ok: false, field: 'name' });
		expect(await listCats(db, 'u1')).toHaveLength(0);
	});

	it('rejects an unknown avatar', async () => {
		await seedUser('u1');
		const result = await createCat(db, 'u1', { name: 'Mittens', avatarId: 'dragon' });
		expect(result).toMatchObject({ ok: false, field: 'avatar' });
	});

	it('enforces the cat cap', async () => {
		await seedUser('u1');
		for (let i = 0; i < CAT_CAP; i += 1) {
			const ok = await createCat(db, 'u1', { name: `Cat ${i}`, avatarId: 'grey' });
			expect(ok.ok).toBe(true);
		}
		const overflow = await createCat(db, 'u1', { name: 'One Too Many', avatarId: 'grey' });
		expect(overflow).toMatchObject({ ok: false, status: 409 });
		expect(await listCats(db, 'u1')).toHaveLength(CAT_CAP);
	});
});

describe('ownership and listing', () => {
	it('lists only the owner cats oldest to newest', async () => {
		await seedUser('u1');
		await seedUser('u2');
		await createCat(db, 'u1', { name: 'First', avatarId: 'orange' }, 1000);
		await createCat(db, 'u1', { name: 'Second', avatarId: 'grey' }, 2000);
		await createCat(db, 'u2', { name: 'Other', avatarId: 'white' }, 1500);

		const list = await listCats(db, 'u1');
		expect(list.map((cat) => cat.name)).toEqual(['First', 'Second']);
	});

	it('rejects access to a foreign cat', async () => {
		await seedUser('u1');
		await seedUser('u2');
		const created = await createCat(db, 'u2', { name: 'Theirs', avatarId: 'white' });
		if (!created.ok) throw new Error('setup failed');

		const owned = await requireCatOwnership(db, 'u1', created.value.id);
		expect(owned).toMatchObject({ ok: false, status: 403 });

		const select = await setActiveCat(db, 'u1', created.value.id);
		expect(select).toMatchObject({ ok: false, status: 403 });
	});
});

describe('removeCat', () => {
	it('re-points the active cat and keeps the user balance', async () => {
		await seedUser('u1');
		const a = await createCat(db, 'u1', { name: 'A', avatarId: 'orange' }, 1000);
		const b = await createCat(db, 'u1', { name: 'B', avatarId: 'grey' }, 2000);
		if (!a.ok || !b.ok) throw new Error('setup failed');

		await setActiveCat(db, 'u1', b.value.id);
		await db.update(users).set({ purrpoints: 120 }).where(eq(users.id, 'u1'));

		const removed = await removeCat(db, 'u1', b.value.id);
		expect(removed.ok).toBe(true);

		const active = await getActiveCat(db, 'u1');
		expect(active?.id).toBe(a.value.id);

		const balance = await db
			.select({ purrpoints: users.purrpoints })
			.from(users)
			.where(eq(users.id, 'u1'));
		expect(balance[0]?.purrpoints).toBe(120);
	});
});

describe('getOrCreateDefaultCat', () => {
	it('creates a default cat when the user has none', async () => {
		await seedUser('u1');
		const cat = await getOrCreateDefaultCat(db, 'u1');
		expect(cat.name).toBe('My cat');
		expect(await listCats(db, 'u1')).toHaveLength(1);
	});
});
