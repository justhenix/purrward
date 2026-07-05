// Coverage for the server-owned economy catalog and its allowlist guards.
import { describe, expect, it } from 'vitest';
import {
	CATALOG,
	findItem,
	isAccessoryId,
	isBackgroundId,
	isGachaEligible,
	type ItemKind
} from './catalog';
import { REWARDS } from './rewards';

const KINDS: ItemKind[] = ['accessory', 'background', 'coupon', 'vet', 'donation'];

describe('findItem', () => {
	it('returns a known item by id', () => {
		expect(findItem('acc_bowtie')?.id).toBe('acc_bowtie');
		expect(findItem('bg_park')?.kind).toBe('background');
	});

	it('returns null for an unknown id', () => {
		expect(findItem('acc_nonexistent')).toBeNull();
	});

	it('returns null for non-string input', () => {
		expect(findItem(undefined)).toBeNull();
		expect(findItem(null)).toBeNull();
		expect(findItem(42)).toBeNull();
		expect(findItem({ id: 'acc_bowtie' })).toBeNull();
	});
});

describe('catalog shape', () => {
	it('gives every item a valid kind and a positive integer cost (0 allowed for the default bg)', () => {
		for (const item of CATALOG) {
			expect(KINDS).toContain(item.kind);
			expect(Number.isInteger(item.cost)).toBe(true);
			expect(item.cost).toBeGreaterThanOrEqual(0);
			// Only the free default background may cost 0; everything else is a positive price.
			if (item.id !== 'bg_home') expect(item.cost).toBeGreaterThan(0);
		}
	});

	it('has unique ids', () => {
		const ids = CATALOG.map((item) => item.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('allowlist guards', () => {
	it('isAccessoryId accepts accessories only', () => {
		expect(isAccessoryId('acc_bowtie')).toBe(true);
		expect(isAccessoryId('bg_park')).toBe(false);
		expect(isAccessoryId('vet_discount')).toBe(false);
		expect(isAccessoryId('acc_unknown')).toBe(false);
		expect(isAccessoryId('')).toBe(false);
		expect(isAccessoryId(null)).toBe(false);
	});

	it('isBackgroundId accepts backgrounds only', () => {
		expect(isBackgroundId('bg_home')).toBe(true);
		expect(isBackgroundId('bg_park')).toBe(true);
		expect(isBackgroundId('acc_bowtie')).toBe(false);
		expect(isBackgroundId('shelter_don')).toBe(false);
		expect(isBackgroundId('bg_unknown')).toBe(false);
	});

	it('isGachaEligible excludes coupon/vet/donation items', () => {
		for (const item of CATALOG) {
			if (item.kind === 'coupon' || item.kind === 'vet' || item.kind === 'donation') {
				expect(isGachaEligible(item.id)).toBe(false);
			}
		}
		// And at least the accessories are eligible.
		expect(isGachaEligible('acc_bowtie')).toBe(true);
	});
});

describe('legacy reward fold', () => {
	it('resolves legacy reward ids with unchanged costs', () => {
		expect(findItem('vet_discount')?.cost).toBe(100);
		expect(findItem('cat_treats')?.cost).toBe(150);
		expect(findItem('feather_wand')?.cost).toBe(200);
		expect(findItem('shelter_don')?.cost).toBe(200);
	});

	it('keeps the legacy REWARDS list intact after folding into the catalog', () => {
		expect(REWARDS.map((reward) => [reward.id, reward.cost])).toEqual([
			['vet_discount', 100],
			['cat_treats', 150],
			['feather_wand', 200],
			['shelter_don', 200]
		]);
	});
});
