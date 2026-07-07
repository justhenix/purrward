// Unit coverage for reminder preference migration and normalization.
import { describe, expect, it } from 'vitest';
import {
	normalizeCareNudges,
	normalizeReminderTimes,
	parsePreferences,
	serializePreferences
} from './preferences';

describe('preferences reminders', () => {
	it('migrates single reminder time into a sorted unique array', () => {
		const preferences = parsePreferences('1:0:initial:1200,0800,0800:system');
		expect(preferences.reminderTime).toBe('08:00');
		expect(preferences.reminderTimes).toEqual(['08:00', '12:00']);
		expect(serializePreferences(preferences)).toBe(
			'1:0:initial:0800,1200:system:feed,groom,litter,meds,play,water'
		);
	});

	it('normalizes submitted reminder times', () => {
		expect(normalizeReminderTimes(['12:00', 'bad', '08:00', '12:00'])).toEqual(['08:00', '12:00']);
	});

	it('normalizes submitted care nudges', () => {
		expect(normalizeCareNudges(['water', 'bad', 'feed', 'water'])).toEqual(['feed', 'water']);
	});

	it('persists empty care nudges when all are unchecked', () => {
		const preferences = parsePreferences('1:0:initial:0800:system:');
		expect(preferences.careNudges).toEqual([]);
		expect(serializePreferences(preferences)).toBe('1:0:initial:0800:system:');
	});
});
