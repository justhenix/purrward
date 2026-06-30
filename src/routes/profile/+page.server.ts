// Profile settings data and persisted preference actions.
import type { Actions, PageServerLoad } from './$types';
import { shouldUseSecureCookie } from '$lib/server/auth';

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

export const load: PageServerLoad = async ({ cookies }) => {
	return {
		preferences: parsePreferences(cookies.get('purrward_prefs'))
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
