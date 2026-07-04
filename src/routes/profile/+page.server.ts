// Profile page data: care stats for the active cat summary.
import type { PageServerLoad } from './$types';
import { habitCompletions } from '$lib/server/db/schema';
import { utcDayStart } from '$lib/server/photo-verification';
import { parsePreferences } from '$lib/server/preferences';
import { parseSandboxTasks, SANDBOX_TASKS_COOKIE } from '$lib/server/sandbox';
import { habitSetFor } from '$lib/tasks';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ cookies, locals, parent }) => {
	let completedTasks: string[] = [];
	let lastVerifiedAt: number | null = null;
	const preferences = parsePreferences(cookies.get('purrward_prefs'));
	const { activeCat } = await parent();

	if (preferences.sandboxMode) {
		completedTasks = parseSandboxTasks(cookies.get(SANDBOX_TASKS_COOKIE));
	} else if (locals.user) {
		const { db } = await import('$lib/server/db');
		const conditions = [
			eq(habitCompletions.userId, locals.user.id),
			eq(habitCompletions.verified, 1),
			eq(habitCompletions.dayStart, utcDayStart())
		];
		if (activeCat) conditions.push(eq(habitCompletions.catId, activeCat.id));
		const rows = await db
			.select({
				taskType: habitCompletions.taskType,
				createdAt: habitCompletions.createdAt
			})
			.from(habitCompletions)
			.where(and(...conditions));

		completedTasks = [...new Set(rows.map((row) => row.taskType))];
		lastVerifiedAt = rows.reduce<number | null>(
			(latest, row) => (latest === null || row.createdAt > latest ? row.createdAt : latest),
			null
		);
	}

	const totalCount = habitSetFor(activeCat?.careMode ?? 'owned').length;

	return {
		preferences,
		careStats: {
			completedCount: completedTasks.length,
			totalCount,
			lastVerifiedAt
		}
	};
};
