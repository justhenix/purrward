// Server helpers for local Purrward preferences stored in a cookie.
import { validateAvatarChoice, type AvatarChoice } from '$lib/avatar-ids';

export type Preferences = {
	careReminders: boolean;
	sandboxMode: boolean;
	avatarChoice: AvatarChoice;
};

export function parsePreferences(value: string | undefined): Preferences {
	const [careReminders, sandboxMode, avatarChoice] = value?.split(':') ?? [];
	return {
		careReminders: careReminders !== '0',
		sandboxMode: sandboxMode === '1',
		avatarChoice: validateAvatarChoice(avatarChoice)
	};
}

export function serializePreferences(input: Preferences): string {
	return `${input.careReminders ? '1' : '0'}:${input.sandboxMode ? '1' : '0'}:${input.avatarChoice}`;
}
