// Deterministic per-period featured reward selection + countdown.

export const ROTATION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_MS = ROTATION_DAYS * DAY_MS;
const FEATURED_COUNT = 3;

// Index of the rotation period that `now` falls into.
export function currentPeriodIndex(now: number): number {
	return Math.floor(now / PERIOD_MS);
}

// Whole days remaining until the next rotation, in [1, ROTATION_DAYS].
export function daysUntilNextRotation(now: number): number {
	const remainingMs = PERIOD_MS - (((now % PERIOD_MS) + PERIOD_MS) % PERIOD_MS);
	return Math.max(1, Math.ceil(remainingMs / DAY_MS));
}

// mulberry32 PRNG: a small, fast, deterministic generator seeded by an integer.
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return function next(): number {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// Deterministic Fisher-Yates shuffle seeded solely by the period index.
export function seededShuffle<T>(arr: T[], seed: number): T[] {
	const result = [...arr];
	const rand = mulberry32(seed);
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		const tmp = result[i];
		result[i] = result[j];
		result[j] = tmp;
	}
	return result;
}

// Deterministic subset for a period: seed a small PRNG by the period index,
// shuffle a copy of the reward id list, take the first `count` ids.
export function featuredRewardIds(ids: string[], now: number, count = FEATURED_COUNT): string[] {
	const seed = currentPeriodIndex(now);
	const order = seededShuffle([...ids], seed);
	return order.slice(0, Math.min(count, ids.length));
}
