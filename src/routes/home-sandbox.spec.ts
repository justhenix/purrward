// Verifies sandbox scene actions bypass point gates while preserving owner-scoped writes.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { cats, users } from '$lib/server/db/schema';
import { parseSandboxTasks } from '$lib/server/sandbox';

const mockState: { db: unknown } = { db: null };
const hasModuleMock = typeof vi.doMock === 'function';

type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: Client;
let db: Database;
let dbPath: string;

if (hasModuleMock) {
	vi.doMock('$lib/server/db', () => ({
		get db() {
			return mockState.db;
		}
	}));
}

beforeEach(async () => {
	if (!hasModuleMock) return;
	dbPath = join(tmpdir(), `purrward-home-sandbox-${crypto.randomUUID()}.db`);
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
			)`
		],
		'write'
	);
	db = drizzle(client, { schema });
	mockState.db = db;
	await db.insert(users).values({
		id: 'u1',
		email: 'u1@example.com',
		purrpoints: 0,
		activeCatId: 'c1',
		createdAt: 1
	} as typeof users.$inferInsert);
	await db.insert(cats).values({
		id: 'c1',
		userId: 'u1',
		name: 'Luna',
		careMode: 'owned',
		avatarId: 'orange',
		purrpoints: 0,
		createdAt: 1
	});
});

afterEach(() => {
	if (!hasModuleMock) return;
	client.close();
	mockState.db = null;
	try {
		rmSync(dbPath, { force: true });
	} catch {
		// Windows may release the temp DB handle after Vitest teardown.
	}
});

describe('home sandbox scene actions', () => {
	const routeIt = hasModuleMock ? it : it.skip;

	routeIt('equips a paid scene with zero points', async () => {
		const { actions } = await import('./+page.server');
		const formData = new FormData();
		formData.set('itemId', 'bg_park');

		const result = await actions.unlockScene({
			locals: { user: { id: 'u1' } },
			request: { formData: async () => formData },
			cookies: { get: () => '1:1:initial:0800:system' }
		} as unknown as Parameters<NonNullable<typeof actions.unlockScene>>[0]);

		expect(result).toEqual({ sceneMessage: 'Equipped' });
		const rows = await db
			.select({ backgroundId: cats.backgroundId })
			.from(cats)
			.where(eq(cats.id, 'c1'));
		expect(rows[0]?.backgroundId).toBe('bg_park');
	});
});

describe('sandbox task state', () => {
	it('keeps community tasks in the completed-task cookie', () => {
		expect(parseSandboxTasks('feeding,street_feeding,shelter_care,nope')).toEqual([
			'feeding',
			'street_feeding',
			'shelter_care'
		]);
	});
});
