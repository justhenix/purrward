// SECURITY: owner-scoped cat profile manager; client cat ids only used inside userId-scoped predicates.
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { cats, habitCompletions, users } from './db/schema';
import { isCatAvatarId, type CatAvatarId } from '$lib/avatar-ids';

type Database = typeof import('./db').db;

export const CAT_CAP = 10; // max cats per user (owned + community combined)
export const CAT_NAME_MAX = 40;

export type CareMode = 'owned' | 'community';

// Curated default names for free-cat (community) onboarding when none is supplied.
const COMMUNITY_DEFAULT_NAMES = ['Community Cat', 'Street Buddy', 'Alley Friend', 'Porch Cat'];

export type CatProfile = {
	id: string;
	name: string;
	careMode: CareMode;
	avatarId: CatAvatarId;
	purrpoints: number;
	createdAt: number;
};

export type CatField = 'name' | 'avatar';

export type CatResult<T> =
	| { ok: true; value: T }
	| { ok: false; status: number; error: string; field?: CatField };

// Per-cat equip state (T4). Null accessory = none; null background reads as the default at render time.
export type EquipState = {
	catId: string;
	equippedAccessoryId: string | null;
	backgroundId: string | null;
};

function isCareMode(value: unknown): value is CareMode {
	return value === 'owned' || value === 'community';
}

function normalizeName(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (trimmed.length < 1 || trimmed.length > CAT_NAME_MAX) return null;
	return trimmed;
}

function toProfile(row: typeof cats.$inferSelect): CatProfile {
	return {
		id: row.id,
		name: row.name,
		careMode: isCareMode(row.careMode) ? row.careMode : 'owned',
		avatarId: (isCatAvatarId(row.avatarId) ? row.avatarId : 'orange') as CatAvatarId,
		purrpoints: row.purrpoints,
		createdAt: row.createdAt
	};
}

export function defaultCommunityName(now = Date.now()): string {
	return COMMUNITY_DEFAULT_NAMES[now % COMMUNITY_DEFAULT_NAMES.length];
}

export async function listCats(database: Database, userId: string): Promise<CatProfile[]> {
	const rows = await database
		.select()
		.from(cats)
		.where(eq(cats.userId, userId))
		.orderBy(asc(cats.createdAt));
	return rows.map(toProfile);
}

// SECURITY: ownership gate — a foreign cat id resolves to null, never leaking another user's cat.
export async function getCat(
	database: Database,
	userId: string,
	catId: string
): Promise<CatProfile | null> {
	const rows = await database
		.select()
		.from(cats)
		.where(and(eq(cats.id, catId), eq(cats.userId, userId)))
		.limit(1);
	return rows[0] ? toProfile(rows[0]) : null;
}

export async function requireCatOwnership(
	database: Database,
	userId: string,
	catId: string
): Promise<CatResult<CatProfile>> {
	const cat = await getCat(database, userId, catId);
	if (!cat) return { ok: false, status: 403, error: 'This cat is not available.' };
	return { ok: true, value: cat };
}

export async function createCat(
	database: Database,
	userId: string,
	input: { name: unknown; avatarId: unknown; careMode?: unknown },
	now = Date.now()
): Promise<CatResult<CatProfile>> {
	const name = normalizeName(input.name);
	if (!name)
		return { ok: false, status: 400, error: 'Enter a cat name (1-40 characters).', field: 'name' };
	if (typeof input.avatarId !== 'string' || !isCatAvatarId(input.avatarId)) {
		return { ok: false, status: 400, error: 'Choose a valid cat avatar.', field: 'avatar' };
	}
	const careMode: CareMode = isCareMode(input.careMode) ? input.careMode : 'owned';

	const existing = await database
		.select({ value: count() })
		.from(cats)
		.where(eq(cats.userId, userId));
	if ((existing[0]?.value ?? 0) >= CAT_CAP) {
		return { ok: false, status: 409, error: `You can keep up to ${CAT_CAP} cats.` };
	}

	const id = crypto.randomUUID();
	await database.transaction(async (tx) => {
		await tx.insert(cats).values({
			id,
			userId,
			name,
			careMode,
			avatarId: input.avatarId as string,
			purrpoints: 0,
			createdAt: now
		});
		// First cat becomes the active cat (Req 3.4).
		const active = await tx
			.select({ activeCatId: users.activeCatId })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		if (!active[0]?.activeCatId) {
			await tx.update(users).set({ activeCatId: id }).where(eq(users.id, userId));
		}
	});

	return {
		ok: true,
		value: {
			id,
			name,
			careMode,
			avatarId: input.avatarId as CatAvatarId,
			purrpoints: 0,
			createdAt: now
		}
	};
}

export async function updateCat(
	database: Database,
	userId: string,
	catId: string,
	input: { name?: unknown; avatarId?: unknown }
): Promise<CatResult<CatProfile>> {
	const owned = await getCat(database, userId, catId);
	if (!owned) return { ok: false, status: 403, error: 'This cat is not available.' };

	const patch: { name?: string; avatarId?: string } = {};
	if (input.name !== undefined) {
		const name = normalizeName(input.name);
		if (!name)
			return {
				ok: false,
				status: 400,
				error: 'Enter a cat name (1-40 characters).',
				field: 'name'
			};
		patch.name = name;
	}
	if (input.avatarId !== undefined) {
		if (typeof input.avatarId !== 'string' || !isCatAvatarId(input.avatarId)) {
			return { ok: false, status: 400, error: 'Choose a valid cat avatar.', field: 'avatar' };
		}
		patch.avatarId = input.avatarId;
	}
	if (Object.keys(patch).length === 0) return { ok: true, value: owned };

	await database
		.update(cats)
		.set(patch)
		.where(and(eq(cats.id, catId), eq(cats.userId, userId)));

	return { ok: true, value: { ...owned, ...patch } as CatProfile };
}

// Removes a cat + its completions; re-points active cat. Balance on users is retained (Req 4.5).
export async function removeCat(
	database: Database,
	userId: string,
	catId: string
): Promise<CatResult<{ activeCatId: string | null }>> {
	const owned = await getCat(database, userId, catId);
	if (!owned) return { ok: false, status: 403, error: 'This cat is not available.' };

	let activeCatId: string | null = null;
	await database.transaction(async (tx) => {
		await tx.delete(habitCompletions).where(eq(habitCompletions.catId, catId));
		await tx.delete(cats).where(and(eq(cats.id, catId), eq(cats.userId, userId)));

		const current = await tx
			.select({ activeCatId: users.activeCatId })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		activeCatId = current[0]?.activeCatId ?? null;
		if (activeCatId === catId) {
			const remaining = await tx
				.select({ id: cats.id })
				.from(cats)
				.where(eq(cats.userId, userId))
				.orderBy(desc(cats.createdAt))
				.limit(1);
			activeCatId = remaining[0]?.id ?? null;
			await tx.update(users).set({ activeCatId }).where(eq(users.id, userId));
		}
	});

	return { ok: true, value: { activeCatId } };
}

export async function setActiveCat(
	database: Database,
	userId: string,
	catId: string
): Promise<CatResult<{ activeCatId: string }>> {
	const owned = await getCat(database, userId, catId);
	if (!owned) return { ok: false, status: 403, error: 'This cat is not available.' };
	await database.update(users).set({ activeCatId: catId }).where(eq(users.id, userId));
	return { ok: true, value: { activeCatId: catId } };
}

// SECURITY: owner-scoped equip write (T4). The userId predicate means a foreign cat is never updated.
export async function applyCatEquip(
	database: Database,
	userId: string,
	catId: string,
	patch: { equippedAccessoryId?: string | null; backgroundId?: string | null }
): Promise<EquipState> {
	await database
		.update(cats)
		.set(patch)
		.where(and(eq(cats.id, catId), eq(cats.userId, userId)));

	const rows = await database
		.select({ equippedAccessoryId: cats.equippedAccessoryId, backgroundId: cats.backgroundId })
		.from(cats)
		.where(and(eq(cats.id, catId), eq(cats.userId, userId)))
		.limit(1);

	return {
		catId,
		equippedAccessoryId: rows[0]?.equippedAccessoryId ?? null,
		backgroundId: rows[0]?.backgroundId ?? null
	};
}

export async function getActiveCat(database: Database, userId: string): Promise<CatProfile | null> {
	const rows = await database
		.select({ activeCatId: users.activeCatId })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	const activeCatId = rows[0]?.activeCatId;
	if (!activeCatId) return null;
	return getCat(database, userId, activeCatId);
}

// Ensures existing/legacy users always have a usable cat context (post-migration safety net).
export async function getOrCreateDefaultCat(
	database: Database,
	userId: string,
	now = Date.now()
): Promise<CatProfile> {
	const active = await getActiveCat(database, userId);
	if (active) return active;

	const list = await listCats(database, userId);
	if (list[0]) {
		await database.update(users).set({ activeCatId: list[0].id }).where(eq(users.id, userId));
		return list[0];
	}

	const created = await createCat(
		database,
		userId,
		{ name: 'Mochi', avatarId: 'orange', careMode: 'owned' },
		now
	);
	// createCat only fails on validation/cap; these inputs are always valid, so this is unreachable.
	if (!created.ok) throw new Error('Failed to create default cat.');
	return created.value;
}
