// Profile settings data and persisted preference actions.
import type { Actions, PageServerLoad } from './$types';
import { shouldUseSecureCookie } from '$lib/server/auth';
import { habitCompletions } from '$lib/server/db/schema';
import { utcDayStart } from '$lib/server/photo-verification';
import { and, eq } from 'drizzle-orm';

type Preferences = {
	careReminders: boolean;
	developerMode: boolean;
};

function parsePreferences(value: string | undefined): Preferences {
	const [careReminders, developerMode] = value?.split(':') ?? [];
	return {
		careReminders: careReminders !== '0',
		developerMode: developerMode === '1'
	};
}

function serializePreferences(input: Preferences): string {
	return `${input.careReminders ? '1' : '0'}:${input.developerMode ? '1' : '0'}`;
}

const TOTAL_CARE_TASKS = 6;

export const load: PageServerLoad = async ({ cookies, locals }) => {
	let completedTasks: string[] = [];
	let lastVerifiedAt: number | null = null;

	if (locals.user) {
		const { db } = await import('$lib/server/db');
		const rows = await db
			.select({
				taskType: habitCompletions.taskType,
				createdAt: habitCompletions.createdAt
			})
			.from(habitCompletions)
			.where(
				and(
					eq(habitCompletions.userId, locals.user.id),
					eq(habitCompletions.verified, 1),
					eq(habitCompletions.dayStart, utcDayStart())
				)
			);

		completedTasks = [...new Set(rows.map((row) => row.taskType))];
		lastVerifiedAt = rows.reduce<number | null>(
			(latest, row) => (latest === null || row.createdAt > latest ? row.createdAt : latest),
			null
		);
	}

	return {
		preferences: parsePreferences(cookies.get('purrward_prefs')),
		careStats: {
			completedCount: completedTasks.length,
			totalCount: TOTAL_CARE_TASKS,
			lastVerifiedAt
		}
	};
};

export const actions: Actions = {
	preferences: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const preferences = {
			careReminders: formData.get('careReminders') === 'on',
			developerMode: formData.get('developerMode') === 'on'
		};

		cookies.set('purrward_prefs', serializePreferences(preferences), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: shouldUseSecureCookie(url),
			maxAge: 60 * 60 * 24 * 365
		});

		return { saved: true };
	}
};
