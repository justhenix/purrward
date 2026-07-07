// Reminders submenu: persist the daily care reminder preference.
import type { Actions } from './$types';
import { shouldUseSecureCookie } from '$lib/server/auth';
import {
	DEFAULT_REMINDER_TIME,
	normalizeCareNudges,
	normalizeReminderTimes,
	parsePreferences,
	serializePreferences
} from '$lib/server/preferences';

export const actions: Actions = {
	reminder: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const current = parsePreferences(cookies.get('purrward_prefs'));
		const submittedTimes = formData.getAll('reminderTimes');
		const reminderTimes =
			submittedTimes.length > 0 ? normalizeReminderTimes(submittedTimes) : current.reminderTimes;
		const careNudges = formData.has('careNudgesSubmitted')
			? normalizeCareNudges(formData.getAll('careNudges'))
			: current.careNudges;
		const preferences = {
			...current,
			careReminders: formData.get('careReminders') === 'on',
			reminderTime: reminderTimes[0] ?? DEFAULT_REMINDER_TIME,
			reminderTimes,
			careNudges
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
