// Reminders submenu: persist the daily care reminder preference.
import type { Actions } from './$types';
import { shouldUseSecureCookie } from '$lib/server/auth';
import {
	normalizeReminderTime,
	parsePreferences,
	serializePreferences
} from '$lib/server/preferences';

export const actions: Actions = {
	reminder: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const current = parsePreferences(cookies.get('purrward_prefs'));
		// The disabled time input is omitted when reminders are off; keep the saved time then.
		const submittedTime = formData.get('reminderTime');
		const preferences = {
			...current,
			careReminders: formData.get('careReminders') === 'on',
			reminderTime:
				submittedTime === null ? current.reminderTime : normalizeReminderTime(submittedTime)
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
