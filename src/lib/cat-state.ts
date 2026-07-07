// Derives the cat avatar mood from today's care progress and time of day (pure + testable).
export type CatState = 'happy' | 'sleeping' | 'content';

export function deriveCatState(input: {
	completed: Iterable<string>;
	required: readonly string[];
	hour?: number; // 0-23 local hour; defaults to now
}): CatState {
	const done = new Set(input.completed);
	const required = input.required.length > 0 ? input.required : ['feeding'];

	// Happy: any verified care task should visibly reward the cat today.
	if (required.some((task) => done.has(task))) return 'happy';

	// Sleeping: quiet night hours before care starts.
	const hour = input.hour ?? new Date().getHours();
	if (hour >= 21 || hour < 6) return 'sleeping';

	return 'content';
}
