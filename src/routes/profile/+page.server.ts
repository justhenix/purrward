// Profile settings data and persisted preference actions.
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { deleteSessionCookie, shouldUseSecureCookie } from '$lib/server/auth';
import { deleteAccount } from '$lib/server/account';
import { habitCompletions } from '$lib/server/db/schema';
import { utcDayStart } from '$lib/server/photo-verification';
import { parsePreferences, serializePreferences } from '$lib/server/preferences';
import { parseSandboxTasks, SANDBOX_TASKS_COOKIE } from '$lib/server/sandbox';
import { validateAvatarChoice } from '$lib/avatar-ids';
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

export const actions: Actions = {
	preferences: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const current = parsePreferences(cookies.get('purrward_prefs'));
		const preferences = {
			avatarChoice: current.avatarChoice,
			careReminders: formData.get('careReminders') === 'on',
			sandboxMode: formData.get('sandboxMode') === 'on'
		};

		cookies.set('purrward_prefs', serializePreferences(preferences), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: shouldUseSecureCookie(url),
			maxAge: 60 * 60 * 24 * 365
		});

		return { saved: true };
	},
	avatar: async ({ request, cookies, locals, url }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in to choose an avatar.' });
		}

		const formData = await request.formData();
		const current = parsePreferences(cookies.get('purrward_prefs'));
		const preferences = {
			...current,
			avatarChoice: validateAvatarChoice(formData.get('avatarChoice')?.toString())
		};

		cookies.set('purrward_prefs', serializePreferences(preferences), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: shouldUseSecureCookie(url),
			maxAge: 60 * 60 * 24 * 365
		});

		return { saved: true };
	},
	deleteAccount: async ({ request, cookies, locals, url }) => {
		// SECURITY: only the authenticated owner can delete their own account.
		if (!locals.user) return fail(401, { message: 'Sign in first.', deleteError: true });

		const formData = await request.formData();
		if (formData.get('confirm') !== 'DELETE') {
			return fail(400, { message: 'Type DELETE to confirm.', deleteError: true });
		}

		try {
			const { db } = await import('$lib/server/db');
			await deleteAccount(db, locals.user.id);
		} catch {
			// SECURITY: never leak internal errors/stack traces to the client.
			return fail(500, { message: 'Could not delete account. Try again.', deleteError: true });
		}

		deleteSessionCookie(cookies, shouldUseSecureCookie(url));
		redirect(303, '/auth/login');
	}
};
