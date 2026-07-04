// Client-safe care task taxonomy shared by UI and the server validation boundary.
export const OWNED_TASK_TYPES = ['feeding', 'water', 'litter', 'play', 'grooming', 'meds'] as const;
export const COMMUNITY_TASK_TYPES = ['street_feeding', 'water', 'shelter_care'] as const;

const ALL_TASK_TYPES = [...OWNED_TASK_TYPES, 'street_feeding', 'shelter_care'] as const;

export type CareMode = 'owned' | 'community';
export type TaskType = (typeof ALL_TASK_TYPES)[number];

export function habitSetFor(careMode: CareMode): readonly TaskType[] {
	return careMode === 'community' ? COMMUNITY_TASK_TYPES : OWNED_TASK_TYPES;
}

export function isTaskType(value: unknown): value is TaskType {
	return typeof value === 'string' && (ALL_TASK_TYPES as readonly string[]).includes(value);
}
