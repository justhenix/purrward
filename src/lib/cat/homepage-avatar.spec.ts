// Unit coverage for the homepage cat avatar resolver (pose/face selection + fallbacks).
import { describe, expect, it } from 'vitest';
import { resolveHomepageCatAvatar } from './homepage-avatar';

describe('resolveHomepageCatAvatar', () => {
	it('composites separated body and face layers rather than a baked image', () => {
		const avatar = resolveHomepageCatAvatar({ coat: 'white', mood: 'normal' });
		expect(avatar.renderStack).toHaveLength(2);
		expect(avatar.renderStack.map((layer) => layer.id)).toEqual(['white_sit', 'normal_green']);
		// Body sits under the face.
		expect(avatar.renderStack[0].zIndex).toBeLessThan(avatar.renderStack[1].zIndex);
	});

	it('gives a white cat green eyes by default across moods', () => {
		expect(resolveHomepageCatAvatar({ coat: 'white', mood: 'normal' }).eyeColor).toBe('green');
		expect(resolveHomepageCatAvatar({ coat: 'white', mood: 'sad' }).renderStack[1].id).toBe(
			'sad_green'
		);
		expect(resolveHomepageCatAvatar({ coat: 'white', mood: 'normal' }).warnings).toHaveLength(0);
	});

	it('uses coat-specific default eye colors', () => {
		expect(resolveHomepageCatAvatar({ coat: 'grey', mood: 'normal' }).renderStack[1].id).toBe(
			'normal_blue'
		);
		expect(resolveHomepageCatAvatar({ coat: 'black', mood: 'normal' }).renderStack[1].id).toBe(
			'normal_orange'
		);
		expect(resolveHomepageCatAvatar({ coat: 'siamese', mood: 'sad' }).renderStack[1].id).toBe(
			'sad_blue'
		);
	});

	it('uses the shared eyeless face for happy and sleepy moods', () => {
		const happy = resolveHomepageCatAvatar({ coat: 'white', mood: 'happy' });
		expect(happy.renderStack[1].id).toBe('happy');
		expect(happy.warnings).toHaveLength(0);
	});

	it('falls back to sit when a requested pose has no body asset', () => {
		const avatar = resolveHomepageCatAvatar({
			coat: 'white',
			mood: 'happy',
			preferredPose: 'play'
		});
		expect(avatar.pose).toBe('sit');
		expect(avatar.renderStack[0].id).toBe('white_sit');
		expect(avatar.warnings.some((w) => w.includes('play pose unavailable'))).toBe(true);
	});

	it('naps on the sit body with a sleepy face and never a sit face on a sleep body', () => {
		const avatar = resolveHomepageCatAvatar({
			coat: 'white',
			mood: 'sleepy',
			preferredPose: 'sleep'
		});
		expect(avatar.pose).toBe('sit');
		expect(avatar.mood).toBe('sleepy');
		expect(avatar.renderStack[1].id).toBe('sleep');
		expect(avatar.warnings.some((w) => w.includes('sleep pose unavailable'))).toBe(true);
	});

	it('keeps a safe sit pose when preferredPose is sit', () => {
		const avatar = resolveHomepageCatAvatar({
			coat: 'orange',
			mood: 'normal',
			preferredPose: 'sit'
		});
		expect(avatar.pose).toBe('sit');
		expect(avatar.warnings).toHaveLength(0);
	});

	it('layers a known accessory and warns on an unknown one', () => {
		const withAccessory = resolveHomepageCatAvatar({
			coat: 'tabby',
			mood: 'normal',
			accessory: 'bandana'
		});
		expect(withAccessory.renderStack.map((layer) => layer.id)).toContain('bandana');
		expect(withAccessory.renderStack.at(-1)?.id).toBe('bandana');

		const bogus = resolveHomepageCatAvatar({ coat: 'tabby', mood: 'normal', accessory: 'jetpack' });
		expect(bogus.renderStack.some((layer) => layer.id === 'jetpack')).toBe(false);
		expect(bogus.warnings.some((w) => w.includes('jetpack'))).toBe(true);
	});
});
