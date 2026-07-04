// SECURITY: DB-backed fixed-window rate limiter for IP/user-scoped actions.
import { and, eq } from 'drizzle-orm';
import { rateLimits } from './db/schema';

type Database = typeof import('./db').db;

export type RateLimitDecision = {
	allowed: boolean;
	retryAfter: number; // seconds until the window resets (0 when allowed)
	remaining: number;
};

// SECURITY: hash the raw key (e.g. IP) so plaintext identifiers are never stored.
export async function hashRateKey(value: string): Promise<string> {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkRateLimit(input: {
	database: Database;
	key: string; // already-hashed identifier
	action: string;
	limit: number;
	windowMs: number;
	now?: number;
}): Promise<RateLimitDecision> {
	const now = input.now ?? Date.now();
	const windowStart = Math.floor(now / input.windowMs) * input.windowMs;
	const id = `${input.action}:${input.key}`;
	const retryAfter = Math.max(1, Math.ceil((windowStart + input.windowMs - now) / 1000));

	return input.database.transaction(async (tx) => {
		const rows = await tx
			.select()
			.from(rateLimits)
			.where(and(eq(rateLimits.id, id)))
			.limit(1);
		const row = rows[0];

		if (!row || row.windowStart !== windowStart) {
			// New window (or first hit): reset the counter.
			if (row) {
				await tx
					.update(rateLimits)
					.set({ windowStart, count: 1, updatedAt: now })
					.where(eq(rateLimits.id, id));
			} else {
				await tx.insert(rateLimits).values({
					id,
					key: input.key,
					action: input.action,
					windowStart,
					count: 1,
					updatedAt: now
				});
			}
			return { allowed: true, retryAfter: 0, remaining: Math.max(0, input.limit - 1) };
		}

		if (row.count >= input.limit) {
			return { allowed: false, retryAfter, remaining: 0 };
		}

		await tx
			.update(rateLimits)
			.set({ count: row.count + 1, updatedAt: now })
			.where(eq(rateLimits.id, id));
		return { allowed: true, retryAfter: 0, remaining: Math.max(0, input.limit - row.count - 1) };
	});
}
