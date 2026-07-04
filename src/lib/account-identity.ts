// Derives a personal parent name and letter avatar from account name or email prefix.
type Identity = { displayName?: string | null; email?: string | null } | null | undefined;

const PLACEHOLDER_NAMES = new Set(['cat parent', 'cat Parent']);

export function emailLocalPart(email: string | null | undefined): string {
	if (!email) return '';
	return email.split('@')[0]?.trim() ?? '';
}

export function deriveParentName(user: Identity): string {
	const name = user?.displayName?.trim();
	if (name && !PLACEHOLDER_NAMES.has(name.toLowerCase())) return name;
	const prefix = emailLocalPart(user?.email);
	return prefix || 'Friend';
}

export function avatarInitial(user: Identity): string {
	return deriveParentName(user).slice(0, 1).toUpperCase() || 'P';
}
