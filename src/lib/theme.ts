// Pure theme-preference resolution shared by server and client.
export type ThemePreference = 'light' | 'dark' | 'system';
export type AppliedTheme = 'light' | 'dark';

const THEME_VALUES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function isThemePreference(value: unknown): value is ThemePreference {
	return typeof value === 'string' && (THEME_VALUES as readonly string[]).includes(value);
}

export function normalizeTheme(value: unknown): ThemePreference {
	return isThemePreference(value) ? value : 'system';
}

// The single source of truth for what tokens get applied.
export function resolveTheme(pref: ThemePreference, systemPrefersDark: boolean): AppliedTheme {
	if (pref === 'dark') return 'dark';
	if (pref === 'light') return 'light';
	return systemPrefersDark ? 'dark' : 'light';
}
