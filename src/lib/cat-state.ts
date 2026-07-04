// Derives the cat avatar mood from today's care progress and time of day (pure + testable).
export type CatState = 'happy' | 'hungry' | 'sleeping' | 'content';

export function deriveCatState(input: {
	completed: Iterable<string>;
	required: readonly string[];
	hour?: number; // 0-23 local hour; defaults to now
}): CatState {
	const done = new Set(input.completed);
	const required = input.required.length > 0 ? input.required : ['feeding'];

	// Happy: every required care task is done today.
	if (required.every((task) => done.has(task))) return 'happy';

	// Hungry: the feeding task (owned or community) is still incomplete.
	const feedingKey = required.includes('street_feeding') ? 'street_feeding' : 'feeding';
	if (required.includes(feedingKey) && !done.has(feedingKey)) return 'hungry';

	// Sleeping: quiet night hours when care is otherwise underway.
	const hour = input.hour ?? new Date().getHours();
	if (hour >= 21 || hour < 6) return 'sleeping';

	return 'content';
}
