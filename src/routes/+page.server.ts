// Home page server data: session, active task, and today's verified care.
import type { PageServerLoad } from './$types';
import { and, eq } from 'drizzle-orm';
import { validateTaskType } from '$lib/server/security';
import { habitCompletions } from '$lib/server/db/schema';
import { utcDayStart } from '$lib/server/photo-verification';

export const load: PageServerLoad = async ({ locals, url }) => {
	let completedTasks: string[] = [];

	if (locals.user) {
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
		completedTasks = [...new Set(rows.map((row) => row.taskType))];
	}

	return {
		user: locals.user,
		selectedTask: validateTaskType(url.searchParams.get('task')) ?? null,
		completedTasks
	};
};
