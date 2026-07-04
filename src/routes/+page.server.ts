// Home page server data: session, active task, today's verified care, and cat switching.
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { validateTaskType } from '$lib/server/security';
import { setActiveCat } from '$lib/server/cats';
import { habitCompletions } from '$lib/server/db/schema';
import { utcDayStart } from '$lib/server/photo-verification';
import { parsePreferences } from '$lib/server/preferences';
import { parseSandboxTasks, SANDBOX_TASKS_COOKIE } from '$lib/server/sandbox';

export const load: PageServerLoad = async ({ cookies, locals, parent, url }) => {
	let completedTasks: string[] = [];
	const preferences = parsePreferences(cookies.get('purrward_prefs'));

	if (preferences.sandboxMode) {
		completedTasks = parseSandboxTasks(cookies.get(SANDBOX_TASKS_COOKIE));
	} else if (locals.user) {
		// Scope today's care to the active cat so per-cat progress stays isolated.
		const { activeCat } = await parent();
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
	}

	return {
		user: locals.user,
		preferences,
		selectedTask: validateTaskType(url.searchParams.get('task')) ?? null,
		completedTasks
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
	}
};
