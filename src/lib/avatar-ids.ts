// Shared avatar preference ids for Google profile photos and local cat artwork.
export const CAT_AVATAR_IDS = [
	'orange',
	'tuxedo',
	'grey',
	'calico',
	'siamese',
	'tabby',
	'white'
] as const;

export type CatAvatarId = (typeof CAT_AVATAR_IDS)[number];
export type AvatarChoice = 'google' | CatAvatarId;

export function isCatAvatarId(value: string): value is CatAvatarId {
	return (CAT_AVATAR_IDS as readonly string[]).includes(value);
}

export function validateAvatarChoice(value: string | null | undefined): AvatarChoice {
	if (value === 'google' || (value && isCatAvatarId(value))) return value;
	return 'google';
}
