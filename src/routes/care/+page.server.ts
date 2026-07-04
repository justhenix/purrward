// Care page server data from today's verified habit completions.
import type { PageServerLoad } from './$types';
import { and, eq } from 'drizzle-orm';
import { habitCompletions } from '$lib/server/db/schema';
import { utcDayStart } from '$lib/server/photo-verification';
import { parsePreferences } from '$lib/server/preferences';
import { parseSandboxTasks, SANDBOX_TASKS_COOKIE } from '$lib/server/sandbox';

export const load: PageServerLoad = async ({ cookies, locals, parent }) => {
	const preferences = parsePreferences(cookies.get('purrward_prefs'));
	if (preferences.sandboxMode)
		return { completedTasks: parseSandboxTasks(cookies.get(SANDBOX_TASKS_COOKIE)) };
	if (!locals.user) return { completedTasks: [] };

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

	return {
		completedTasks: [...new Set(rows.map((row) => row.taskType))]
	};
};
