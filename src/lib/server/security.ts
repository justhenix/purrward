// SECURITY: input sanitization, rate limiting, security utilities

/** SECURITY: strip HTML tags to prevent XSS */
export function sanitize(input: string): string {
	return input.replace(/[<>]/g, '');
}

/** SECURITY: validate MIME type for photo uploads */
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export function validateUpload(file: File): { ok: boolean; error?: string } {
	if (!ALLOWED_MIMES.includes(file.type as (typeof ALLOWED_MIMES)[number])) {
		return { ok: false, error: 'Invalid file type. Use JPEG, PNG, or WebP.' };
	}
	if (file.size > MAX_UPLOAD_BYTES) {
		return { ok: false, error: 'File too large. Maximum 5MB.' };
	}
	return { ok: true };
}
