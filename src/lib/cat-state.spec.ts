// Unit coverage for the cat mood derivation helper.
import { describe, expect, it } from 'vitest';
import { deriveCatState } from './cat-state';
import { OWNED_TASK_TYPES, COMMUNITY_TASK_TYPES } from './tasks';

describe('deriveCatState', () => {
	it('is happy when every required task is done', () => {
		expect(
			deriveCatState({ completed: [...OWNED_TASK_TYPES], required: OWNED_TASK_TYPES, hour: 12 })
		).toBe('happy');
	});

	it('is hungry when feeding is incomplete', () => {
		expect(
			deriveCatState({ completed: ['water', 'play'], required: OWNED_TASK_TYPES, hour: 12 })
		).toBe('hungry');
	});

	it('uses street_feeding as the hunger signal for community cats', () => {
		expect(deriveCatState({ completed: ['water'], required: COMMUNITY_TASK_TYPES, hour: 12 })).toBe(
			'hungry'
		);
	});

	it('sleeps at night when fed but not fully done', () => {
		expect(deriveCatState({ completed: ['feeding'], required: OWNED_TASK_TYPES, hour: 23 })).toBe(
			'sleeping'
		);
	});

	it('is content during the day when fed but tasks remain', () => {
		expect(deriveCatState({ completed: ['feeding'], required: OWNED_TASK_TYPES, hour: 12 })).toBe(
			'content'
		);
	});
});
