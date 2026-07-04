// Developer submenu: persist the sandbox mode preference (server authoritative).
import type { Actions } from './$types';
import { shouldUseSecureCookie } from '$lib/server/auth';
import { parsePreferences, serializePreferences } from '$lib/server/preferences';
import { SANDBOX_TASKS_COOKIE } from '$lib/server/sandbox';

export const actions: Actions = {
	sandbox: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const current = parsePreferences(cookies.get('purrward_prefs'));
		const preferences = {
			...current,
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
	// Clears only the sandbox task cookie; real points and history are untouched.
	reset: async ({ cookies }) => {
		cookies.delete(SANDBOX_TASKS_COOKIE, { path: '/' });
		return { reset: true };
	}
};
