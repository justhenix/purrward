// Care page server data from today's verified habit completions.
import type { PageServerLoad } from './$types';
import { and, eq } from 'drizzle-orm';
import { habitCompletions } from '$lib/server/db/schema';
import { utcDayStart } from '$lib/server/photo-verification';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { completedTasks: [] };

	const { db } = await import('$lib/server/db');
	const rows = await db
		.select({ taskType: habitCompletions.taskType })
		.from(habitCompletions)
		.where(
			and(
				eq(habitCompletions.userId, locals.user.id),
				eq(habitCompletions.verified, 1),
				eq(habitCompletions.dayStart, utcDayStart())
			)
		);

	return {
		completedTasks: [...new Set(rows.map((row) => row.taskType))]
	};
};
