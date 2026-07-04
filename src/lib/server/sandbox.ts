// Sandbox mode helpers for local test-only care state.
import type { TaskType } from './security';

export const SANDBOX_POINTS_PER_PROOF = 1000;
export const SANDBOX_BALANCE = 999999;
export const SANDBOX_TASKS_COOKIE = 'purrward_sandbox_tasks';

export function parseSandboxTasks(value: string | undefined): TaskType[] {
	const seen = new Set<TaskType>();
	for (const item of value?.split(',') ?? []) {
		if (
			item === 'feeding' ||
			item === 'water' ||
			item === 'litter' ||
			item === 'play' ||
			item === 'grooming' ||
			item === 'meds'
		) {
			seen.add(item);
		}
	}
	return [...seen];
}

export function serializeSandboxTasks(tasks: TaskType[]): string {
	return [...new Set(tasks)].join(',');
}
