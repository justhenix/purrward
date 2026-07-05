// Maps local avatar ids to selector previews and display artwork.
import calicoCat from '$lib/assets/cats/sit_pfp_or_fallback/calico_sit.webp';
import greyCat from '$lib/assets/cats/sit_pfp_or_fallback/grey_sit.webp';
import orangeCat from '$lib/assets/cats/sit_pfp_or_fallback/orange_sit.webp';
import siameseCat from '$lib/assets/cats/sit_pfp_or_fallback/siamese_sit.webp';
import tabbyCat from '$lib/assets/cats/sit_pfp_or_fallback/tabby_sit.webp';
import tuxedoCat from '$lib/assets/cats/sit_pfp_or_fallback/tuxedo_sit.webp';
import whiteCat from '$lib/assets/cats/sit_pfp_or_fallback/white_sit.webp';
import type { CatAvatarId } from '$lib/avatar-ids';
import { isCatAvatarId } from '$lib/avatar-ids';

export type CatAvatarOption = {
	id: CatAvatarId;
	label: string;
	src: string;
};

export const CAT_AVATAR_ARTWORK: readonly CatAvatarOption[] = [
	{ id: 'orange', label: 'Orange', src: orangeCat },
	{ id: 'tuxedo', label: 'Tuxedo', src: tuxedoCat },
	{ id: 'grey', label: 'Grey', src: greyCat },
	{ id: 'calico', label: 'Calico', src: calicoCat },
	{ id: 'siamese', label: 'Siamese', src: siameseCat },
	{ id: 'tabby', label: 'Tabby', src: tabbyCat },
	{ id: 'white', label: 'White', src: whiteCat }
];

export const CAT_AVATARS: readonly CatAvatarOption[] = [
	{ id: 'orange', label: 'Orange', src: orangeCat },
	{ id: 'tuxedo', label: 'Tuxedo', src: tuxedoCat },
	{ id: 'grey', label: 'Grey', src: greyCat },
	{ id: 'calico', label: 'Calico', src: calicoCat },
	{ id: 'siamese', label: 'Siamese', src: siameseCat },
	{ id: 'tabby', label: 'Tabby', src: tabbyCat },
	{ id: 'white', label: 'White', src: whiteCat }
];

export function getCatAvatar(value: string | null | undefined): CatAvatarOption | null {
	if (!value || !isCatAvatarId(value)) return null;
	return CAT_AVATAR_ARTWORK.find((avatar) => avatar.id === value) ?? null;
}
