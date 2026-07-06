// Persists the user's color-theme preference to the purrward_prefs cookie.
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { shouldUseSecureCookie } from '$lib/server/auth';
import { parsePreferences, serializePreferences } from '$lib/server/preferences';
import { isThemePreference, normalizeTheme } from '$lib/theme';

export const POST: RequestHandler = async ({ cookies, request, url }) => {
	const formData = await request.formData();
	const current = parsePreferences(cookies.get('purrward_prefs'));
	const submitted = formData.get('theme')?.toString();
	const theme = isThemePreference(submitted) ? submitted : normalizeTheme(current.theme);
	const preferences = { ...current, theme };

	cookies.set('purrward_prefs', serializePreferences(preferences), {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: shouldUseSecureCookie(url),
		maxAge: 60 * 60 * 24 * 365
	});

	return json({ theme });
};
