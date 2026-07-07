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

	it('is happy after a verified task even if feeding is incomplete', () => {
		expect(deriveCatState({ completed: ['water'], required: OWNED_TASK_TYPES, hour: 12 })).toBe(
			'happy'
		);
	});

	it('is happy after a community care task is verified', () => {
		expect(deriveCatState({ completed: ['water'], required: COMMUNITY_TASK_TYPES, hour: 12 })).toBe(
			'happy'
		);
	});

	it('sleeps at night before care starts', () => {
		expect(deriveCatState({ completed: [], required: OWNED_TASK_TYPES, hour: 23 })).toBe(
			'sleeping'
		);
	});

	it('is content during the day before care starts', () => {
		expect(deriveCatState({ completed: [], required: OWNED_TASK_TYPES, hour: 12 })).toBe('content');
	});
});
