// Home page server data: session, active task, today's verified care, and cat switching.
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { validateTaskType } from '$lib/server/security';
import { applyCatEquip, getActiveCat, setActiveCat } from '$lib/server/cats';
import { habitCompletions, userInventory } from '$lib/server/db/schema';
import { DEFAULT_BACKGROUND_ID, findItem } from '$lib/server/catalog';
import { equipItem, listEquippedAccessories } from '$lib/server/inventory';
import { utcDayStart } from '$lib/server/photo-verification';
import { parsePreferences } from '$lib/server/preferences';
import { checkPurchaseRateLimit, purchaseItem } from '$lib/server/purchase';
import { parseSandboxTasks, SANDBOX_TASKS_COOKIE } from '$lib/server/sandbox';

const HOME_BACKGROUND_IDS = [DEFAULT_BACKGROUND_ID, 'bg_park'] as const;
type HomeBackgroundId = (typeof HOME_BACKGROUND_IDS)[number];

function isHomeBackgroundId(value: unknown): value is HomeBackgroundId {
	return typeof value === 'string' && (HOME_BACKGROUND_IDS as readonly string[]).includes(value);
}

export const load: PageServerLoad = async ({ cookies, locals, parent, url }) => {
	let completedTasks: string[] = [];
	const preferences = parsePreferences(cookies.get('purrward_prefs'));
	const parentData = await parent();
	const ownedBackgroundIds = new Set<HomeBackgroundId>([DEFAULT_BACKGROUND_ID]);
	let equippedAccessories: Awaited<ReturnType<typeof listEquippedAccessories>> = [];

	if (preferences.sandboxMode) {
		completedTasks = parseSandboxTasks(cookies.get(SANDBOX_TASKS_COOKIE));
	} else if (locals.user) {
		// Scope today's care to the active cat so per-cat progress stays isolated.
		const { activeCat } = parentData;
		const { db } = await import('$lib/server/db');
		const conditions = [
			eq(habitCompletions.userId, locals.user.id),
			eq(habitCompletions.verified, 1),
			eq(habitCompletions.dayStart, utcDayStart())
		];
		if (activeCat) conditions.push(eq(habitCompletions.catId, activeCat.id));
		const rows = await db
			.select({ taskType: habitCompletions.taskType })
			.from(habitCompletions)
			.where(and(...conditions));
		completedTasks = [...new Set(rows.map((row) => row.taskType))];

		const ownedRows = await db
			.select({ itemId: userInventory.itemId })
			.from(userInventory)
			.where(and(eq(userInventory.userId, locals.user.id), eq(userInventory.kind, 'background')));
		for (const row of ownedRows) {
			if (isHomeBackgroundId(row.itemId)) ownedBackgroundIds.add(row.itemId);
		}
	}

	const equippedBackgroundId = isHomeBackgroundId(parentData.activeCat?.backgroundId)
		? parentData.activeCat.backgroundId
		: DEFAULT_BACKGROUND_ID;

	if (locals.user && parentData.activeCat) {
		const { db } = await import('$lib/server/db');
		equippedAccessories = await listEquippedAccessories(
			db,
			locals.user.id,
			parentData.activeCat.id
		);
	}

	return {
		user: locals.user,
		preferences,
		selectedTask: validateTaskType(url.searchParams.get('task')) ?? null,
		completedTasks,
		equippedAccessories,
		backgroundScenes: HOME_BACKGROUND_IDS.map((id) => {
			const item = findItem(id);
			return {
				id,
				title: id === DEFAULT_BACKGROUND_ID ? 'Room' : 'Park',
				cost: item?.cost ?? 0,
				owned: preferences.sandboxMode || ownedBackgroundIds.has(id),
				equipped: equippedBackgroundId === id
			};
		})
	};
};

export const actions: Actions = {
	// Switch the active cat straight from Home so routine care never needs a detour.
	select: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Sign in first.' });
		const formData = await request.formData();
		const catId = formData.get('catId');
		if (typeof catId !== 'string') return fail(400, { message: 'Choose a cat.' });
		const { db } = await import('$lib/server/db');
		const result = await setActiveCat(db, locals.user.id, catId);
		if (!result.ok) return fail(result.status, { message: result.error });
		return { selected: true };
	},
	unlockScene: async ({ cookies, locals, request }) => {
		if (!locals.user) return fail(401, { sceneError: 'Sign in first.' });
		const formData = await request.formData();
		const itemId = formData.get('itemId');
		if (!isHomeBackgroundId(itemId) || itemId === DEFAULT_BACKGROUND_ID) {
			return fail(400, { sceneError: 'Choose a scene.' });
		}

		const { db } = await import('$lib/server/db');
		const activeCat = await getActiveCat(db, locals.user.id);
		if (!activeCat) return fail(400, { sceneError: 'Choose a cat.' });
		if (parsePreferences(cookies.get('purrward_prefs')).sandboxMode) {
			await applyCatEquip(db, locals.user.id, activeCat.id, { backgroundId: itemId });
			return { sceneMessage: 'Equipped' };
		}
		// SECURITY: purchase rate, price, ownership, and point deduction are server-owned.
		const limit = await checkPurchaseRateLimit({ database: db, userId: locals.user.id });
		if (!limit.allowed) return fail(429, { sceneError: 'Try again later.' });

		const result = await purchaseItem({ database: db, userId: locals.user.id, itemId });
		if (!result.ok && result.error !== 'You already own this item.') {
			return fail(result.status, {
				sceneError: result.error === 'Not enough Purrpoints.' ? 'Not enough points' : result.error
			});
		}

		const equip = await equipItem({
			database: db,
			userId: locals.user.id,
			catId: activeCat.id,
			slot: 'background',
			itemId
		});
		if (!equip.ok) return fail(equip.status, { sceneError: equip.error });
		return { sceneMessage: 'Equipped' };
	},
	equipScene: async ({ cookies, locals, request }) => {
		if (!locals.user) return fail(401, { sceneError: 'Sign in first.' });
		const formData = await request.formData();
		const itemId = formData.get('itemId');
		if (!isHomeBackgroundId(itemId)) return fail(400, { sceneError: 'Choose a scene.' });

		const { db } = await import('$lib/server/db');
		const activeCat = await getActiveCat(db, locals.user.id);
		if (!activeCat) return fail(400, { sceneError: 'Choose a cat.' });
		if (parsePreferences(cookies.get('purrward_prefs')).sandboxMode) {
			await applyCatEquip(db, locals.user.id, activeCat.id, {
				backgroundId: itemId === DEFAULT_BACKGROUND_ID ? null : itemId
			});
			return { sceneMessage: 'Equipped' };
		}
		const result = await equipItem({
			database: db,
			userId: locals.user.id,
			catId: activeCat.id,
			slot: 'background',
			itemId: itemId === DEFAULT_BACKGROUND_ID ? null : itemId
		});
		if (!result.ok) {
			return fail(result.status, {
				sceneError: result.error === 'You do not own this item.' ? 'Unlock first' : result.error
			});
		}
		return { sceneMessage: 'Equipped' };
	}
};
