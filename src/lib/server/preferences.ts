// Server helpers for local Purrward preferences stored in a cookie.
import { validateAvatarChoice, type AvatarChoice } from '$lib/avatar-ids';
import { normalizeTheme, type ThemePreference } from '$lib/theme';

export const DEFAULT_REMINDER_TIME = '08:00';
const DEFAULT_CARE_NUDGES = ['feed', 'water', 'litter', 'play', 'groom', 'meds'] as const;
const CARE_NUDGE_IDS = new Set<string>(DEFAULT_CARE_NUDGES);

export type Preferences = {
	careReminders: boolean;
	sandboxMode: boolean;
	avatarChoice: AvatarChoice;
	reminderTime: string;
	reminderTimes: string[];
	careNudges: string[];
	theme: ThemePreference;
};

// Reminder time is stored as compact HHMM digits so it never clashes with the ':' delimiter.
function parseReminderTime(value: string | undefined): string {
	if (!value) return DEFAULT_REMINDER_TIME;
	const match = /^([01]\d|2[0-3])([0-5]\d)$/.exec(value);
	return match ? `${match[1]}:${match[2]}` : DEFAULT_REMINDER_TIME;
}

export function sortReminderTimes(times: readonly string[]): string[] {
	return [...new Set(times)].sort((a, b) => a.localeCompare(b));
}

function parseReminderTimes(value: string | undefined): string[] {
	const times = value?.split(',').map(parseReminderTime).filter(Boolean);
	return times?.length ? sortReminderTimes(times) : [DEFAULT_REMINDER_TIME];
}

// Normalizes a form 'HH:MM' value; falls back to the default when malformed.
export function normalizeReminderTime(value: unknown): string {
	if (typeof value !== 'string') return DEFAULT_REMINDER_TIME;
	const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
	return match ? `${match[1]}:${match[2]}` : DEFAULT_REMINDER_TIME;
}

function normalizeSubmittedReminderTime(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
	return match ? `${match[1]}:${match[2]}` : null;
}

export function normalizeReminderTimes(value: unknown): string[] {
	const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
	const times = values
		.map(normalizeSubmittedReminderTime)
		.filter((time): time is string => time !== null);
	return times.length ? sortReminderTimes(times) : [DEFAULT_REMINDER_TIME];
}

export function normalizeCareNudges(value: unknown): string[] {
	const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
	return [
		...new Set(
			values.filter((item): item is string => typeof item === 'string' && CARE_NUDGE_IDS.has(item))
		)
	].sort((a, b) => a.localeCompare(b));
}

function parseCareNudges(value: string | undefined): string[] {
	return value === undefined ? [...DEFAULT_CARE_NUDGES] : normalizeCareNudges(value);
}

export function parsePreferences(value: string | undefined): Preferences {
	const [careReminders, sandboxMode, avatarChoice, reminderTime, theme, careNudges] =
		value?.split(':') ?? [];
	const reminderTimes = parseReminderTimes(reminderTime);
	return {
		careReminders: careReminders !== '0',
		sandboxMode: sandboxMode === '1',
		avatarChoice: validateAvatarChoice(avatarChoice),
		reminderTime: reminderTimes[0] ?? DEFAULT_REMINDER_TIME,
		reminderTimes,
		careNudges: parseCareNudges(careNudges),
		theme: normalizeTheme(theme)
	};
}

export function serializePreferences(input: Preferences): string {
	const times = normalizeReminderTimes(input.reminderTimes ?? input.reminderTime)
		.map((time) => time.replace(':', ''))
		.join(',');
	const careNudges = normalizeCareNudges(input.careNudges).join(',');
	return `${input.careReminders ? '1' : '0'}:${input.sandboxMode ? '1' : '0'}:${input.avatarChoice}:${times}:${input.theme}:${careNudges}`;
}
