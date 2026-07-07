// Verifies Home scene copy stays human and compact.
import { describe, expect, it } from 'vitest';
import { compactPointValue, displayCatName, displayParentName } from './home-copy';

describe('home copy helpers', () => {
	it('keeps real cat names and replaces generic or id-like labels', () => {
		expect(displayCatName('Gamma')).toBe('Gamma');
		expect(displayCatName(' Sir Fluffington III ')).toBe('Sir Fluffington III');
		expect(displayCatName('your cat')).toBe('Mochi');
		expect(displayCatName(undefined)).toBe('Mochi');
		expect(displayCatName('ga-01JZV8G9A5CN9V0G3N6N8W8Z2A')).toBe('Friend');
		expect(displayCatName('9f1c0a7d-4b3e-4c8d-9a11-2b7c6d8e9f00')).toBe('Friend');
	});

	it('compacts point values for tight chips', () => {
		expect(compactPointValue(10)).toBe('10');
		expect(compactPointValue(999)).toBe('999');
		expect(compactPointValue(1000)).toBe('1k');
		expect(compactPointValue(999999)).toBe('999k');
	});

	it('keeps greeting names short and human', () => {
		expect(displayParentName('Gamma')).toBe('Gamma');
		expect(displayParentName('Cat Parent')).toBe('');
		expect(displayParentName(null)).toBe('');
		expect(displayParentName('ga-01JZV8G9A5CN9V0G3N6N8W8Z2A')).toBe('Friend');
	});
});
