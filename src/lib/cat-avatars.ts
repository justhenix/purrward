// Maps local avatar ids to selector previews and display artwork.
import blackCat from '$lib/assets/cats/sit_pfp_or_fallback/black_sit.webp';
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
	name: string;
	src: string;
	asset: string;
	traits: readonly string[];
	matchDescription: string;
};

function avatar(
	id: CatAvatarId,
	name: string,
	src: string,
	traits: readonly string[],
	matchDescription: string
): CatAvatarOption {
	return { id, label: name, name, src, asset: src, traits, matchDescription };
}

export const CAT_AVATARS: readonly CatAvatarOption[] = [
	avatar(
		'orange',
		'Orange',
		orangeCat,
		['orange coat', 'ginger coat'],
		'Orange or ginger cat with warm coat color.'
	),
	avatar(
		'tuxedo',
		'Tuxedo',
		tuxedoCat,
		['black and white', 'white chest'],
		'Black and white cat with a white chest or face markings.'
	),
	avatar(
		'grey',
		'Grey',
		greyCat,
		['grey coat', 'solid grey'],
		'Grey cat with a mostly solid grey coat.'
	),
	avatar(
		'calico',
		'Calico',
		calicoCat,
		['black orange white patches'],
		'Cat with black, orange, and white patch markings.'
	),
	avatar(
		'siamese',
		'Siamese',
		siameseCat,
		['cream body', 'dark face ears paws'],
		'Light body with darker face, ears, paws, or tail.'
	),
	avatar(
		'tabby',
		'Tabby',
		tabbyCat,
		['striped coat', 'tabby markings'],
		'Striped cat with tabby-like coat markings.'
	),
	avatar(
		'white',
		'White',
		whiteCat,
		['white coat', 'cream coat'],
		'White or very light cream cat.'
	),
	avatar(
		'black',
		'Black',
		blackCat,
		['black coat', 'solid dark coat'],
		'Black cat with a solid dark coat.'
	)
];

export const CAT_AVATAR_ARTWORK = CAT_AVATARS;

export function getCatAvatar(value: string | null | undefined): CatAvatarOption | null {
	if (!value || !isCatAvatarId(value)) return null;
	return CAT_AVATAR_ARTWORK.find((avatar) => avatar.id === value) ?? null;
}
