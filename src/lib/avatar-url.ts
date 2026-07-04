// Shared safe-image URL checks for local avatars and Google profile photos.
export function isRenderableAvatarUrl(value: string | null | undefined): value is string {
	if (!value) return false;
	if (value.startsWith('/') || value.startsWith('data:') || value.startsWith('blob:')) return true;

	try {
		const url = new URL(value);
		return url.protocol === 'https:' && url.hostname.endsWith('.googleusercontent.com');
	} catch {
		return false;
	}
}
