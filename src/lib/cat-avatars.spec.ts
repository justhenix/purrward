// Coverage for cat avatar assets and lookup mapping.
import { describe, expect, it } from 'vitest';
import orangeSit from '$lib/assets/cats/sit_pfp_or_fallback/orange_sit.webp';
import { CAT_AVATAR_ARTWORK, CAT_AVATARS, getCatAvatar } from './cat-avatars';

describe('cat avatars', () => {
	it('uses sit assets for avatar lookup and picker artwork', () => {
		expect(getCatAvatar('orange')?.src).toBe(orangeSit);
		expect(CAT_AVATAR_ARTWORK[0].src).toBe(orangeSit);
		expect(CAT_AVATARS[0].src).toBe(orangeSit);
	});
});
