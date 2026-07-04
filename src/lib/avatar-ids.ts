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
// 'initial' renders a generic letter avatar; auth providers are never used as the avatar.
export type AvatarChoice = 'initial' | CatAvatarId;

export function isCatAvatarId(value: string): value is CatAvatarId {
	return (CAT_AVATAR_IDS as readonly string[]).includes(value);
}

export function validateAvatarChoice(value: string | null | undefined): AvatarChoice {
	if (value === 'initial') return 'initial';
	if (value && isCatAvatarId(value)) return value;
	return 'initial';
}
