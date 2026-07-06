// Server helpers for local Purrward preferences stored in a cookie.
import { validateAvatarChoice, type AvatarChoice } from '$lib/avatar-ids';
import { normalizeTheme, type ThemePreference } from '$lib/theme';

export const DEFAULT_REMINDER_TIME = '08:00';

export type Preferences = {
	careReminders: boolean;
	sandboxMode: boolean;
	avatarChoice: AvatarChoice;
	reminderTime: string;
	theme: ThemePreference;
};

// Reminder time is stored as compact HHMM digits so it never clashes with the ':' delimiter.
function parseReminderTime(value: string | undefined): string {
	if (!value) return DEFAULT_REMINDER_TIME;
	const match = /^([01]\d|2[0-3])([0-5]\d)$/.exec(value);
	return match ? `${match[1]}:${match[2]}` : DEFAULT_REMINDER_TIME;
}

// Normalizes a form 'HH:MM' value; falls back to the default when malformed.
export function normalizeReminderTime(value: unknown): string {
	if (typeof value !== 'string') return DEFAULT_REMINDER_TIME;
	const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
	return match ? `${match[1]}:${match[2]}` : DEFAULT_REMINDER_TIME;
}

export function parsePreferences(value: string | undefined): Preferences {
	const [careReminders, sandboxMode, avatarChoice, reminderTime, theme] = value?.split(':') ?? [];
	return {
		careReminders: careReminders !== '0',
		sandboxMode: sandboxMode === '1',
		avatarChoice: validateAvatarChoice(avatarChoice),
		reminderTime: parseReminderTime(reminderTime),
		theme: normalizeTheme(theme)
	};
}

export function serializePreferences(input: Preferences): string {
	const time = input.reminderTime.replace(':', '');
	return `${input.careReminders ? '1' : '0'}:${input.sandboxMode ? '1' : '0'}:${input.avatarChoice}:${time}:${input.theme}`;
}
