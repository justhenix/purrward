// Coverage for the DB-backed fixed-window rate limiter using an in-memory libsql database.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './db/schema';
import { checkRateLimit } from './rate-limit';
import { parsePositiveInt } from './rate-limit-config';

type Database = Parameters<typeof checkRateLimit>[0]['database'];

let client: Client;
let db: Database;
let dbPath: string;

beforeEach(async () => {
	// libsql ':memory:' does not persist tables across connections; use a temp file db.
	dbPath = join(tmpdir(), `purrward-rl-${crypto.randomUUID()}.db`);
	client = createClient({ url: `file:${dbPath.replace(/\\/g, '/')}` });
	await client.execute(
		`CREATE TABLE rate_limits (
			id text PRIMARY KEY NOT NULL,
			key text NOT NULL,
			action text NOT NULL,
			window_start integer NOT NULL,
			count integer NOT NULL,
			updated_at integer NOT NULL
		)`
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

const base = { action: 'api', limit: 3, windowMs: 60_000, now: 1_000_000 };

describe('checkRateLimit', () => {
	it('allows requests below the cap', async () => {
		const first = await checkRateLimit({ database: db, key: 'ip-a', ...base });
		const second = await checkRateLimit({ database: db, key: 'ip-a', ...base });

		expect(first.allowed).toBe(true);
		expect(first.remaining).toBe(2);
		expect(second.allowed).toBe(true);
		expect(second.remaining).toBe(1);
	});

	it('blocks at the cap and returns a positive Retry-After', async () => {
		await checkRateLimit({ database: db, key: 'ip-b', ...base });
		await checkRateLimit({ database: db, key: 'ip-b', ...base });
		await checkRateLimit({ database: db, key: 'ip-b', ...base });
		const blocked = await checkRateLimit({ database: db, key: 'ip-b', ...base });

		expect(blocked.allowed).toBe(false);
		expect(blocked.retryAfter).toBeGreaterThan(0);
		expect(blocked.remaining).toBe(0);
	});

	it('does not share quota across different keys', async () => {
		await checkRateLimit({ database: db, key: 'ip-c', ...base });
		await checkRateLimit({ database: db, key: 'ip-c', ...base });
		await checkRateLimit({ database: db, key: 'ip-c', ...base });
		const other = await checkRateLimit({ database: db, key: 'ip-d', ...base });

		expect(other.allowed).toBe(true);
		expect(other.remaining).toBe(2);
	});

	it('resets the counter when a new window starts', async () => {
		await checkRateLimit({ database: db, key: 'ip-e', ...base });
		await checkRateLimit({ database: db, key: 'ip-e', ...base });
		await checkRateLimit({ database: db, key: 'ip-e', ...base });
		const blocked = await checkRateLimit({ database: db, key: 'ip-e', ...base });
		expect(blocked.allowed).toBe(false);

		// Advance beyond the window.
		const next = await checkRateLimit({
			database: db,
			key: 'ip-e',
			...base,
			now: base.now + base.windowMs + 1
		});
		expect(next.allowed).toBe(true);
		expect(next.remaining).toBe(2);
	});
});

describe('parsePositiveInt', () => {
	it('uses only positive safe integers', () => {
		expect(parsePositiveInt('7', 3)).toBe(7);
		expect(parsePositiveInt('0', 3)).toBe(3);
		expect(parsePositiveInt('2.5', 3)).toBe(3);
		expect(parsePositiveInt(undefined, 3)).toBe(3);
	});
});
