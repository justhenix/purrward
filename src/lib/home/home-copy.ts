// Formats compact Home scene copy for cat labels and point chips.
const GENERIC_CAT_NAMES = new Set([
	'your cat',
	'active cat',
	'selected cat',
	'guest cat',
	'demo cat',
	'guest/demo cat',
	'my cat'
]);
const GENERIC_PARENT_NAMES = new Set(['cat parent', 'parent', 'user']);

const UUID_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isIdLikeCatName(value: string): boolean {
	const lower = value.toLowerCase();
	return (
		UUID_NAME.test(lower) ||
		lower.startsWith('ga-') ||
		/\d{7,}/.test(lower) ||
		/^[a-f0-9]{12,}$/i.test(lower) ||
		(lower.length > 18 && /^[a-z0-9_-]+$/.test(lower) && /[\d_-]/.test(lower))
	);
}

export function displayCatName(value: string | null | undefined): string {
	const trimmed = value?.trim() ?? '';
	if (!trimmed || GENERIC_CAT_NAMES.has(trimmed.toLowerCase())) return 'Mochi';
	if (isIdLikeCatName(trimmed)) return 'Friend';
	return trimmed;
}

export function displayParentName(value: string | null | undefined): string {
	const trimmed = value?.trim() ?? '';
	if (!trimmed || GENERIC_PARENT_NAMES.has(trimmed.toLowerCase())) return '';
	if (isIdLikeCatName(trimmed)) return 'Friend';
	return trimmed;
}

export function compactPointValue(value: number): string {
	const points = Math.trunc(value);
	const sign = points < 0 ? '-' : '';
	const abs = Math.abs(points);
	if (abs >= 1_000_000) return `${sign}${Math.floor(abs / 1_000_000)}m`;
	if (abs >= 1_000) return `${sign}${Math.floor(abs / 1_000)}k`;
	return String(points);
}
