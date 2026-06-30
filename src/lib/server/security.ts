// SECURITY: input sanitization, rate limiting, security utilities

/** SECURITY: strip HTML tags to prevent XSS */
export function sanitize(input: string): string {
	return input.replace(/[<>]/g, '');
}

/** SECURITY: validate MIME type for photo uploads */
const ALLOWED_MIMES = ['image/jpeg', 'image/png'] as const;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const TASK_TYPES = ['feeding', 'water', 'litter', 'play', 'grooming', 'meds'] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export function validateUpload(file: File): { ok: boolean; error?: string } {
	if (!ALLOWED_MIMES.includes(file.type as (typeof ALLOWED_MIMES)[number])) {
		return { ok: false, error: 'Invalid file type. Use JPEG or PNG.' };
	}
	if (file.size > MAX_UPLOAD_BYTES) {
		return { ok: false, error: 'File too large. Maximum 5MB.' };
	}
	return { ok: true };
}

export function validateTaskType(value: FormDataEntryValue | null): TaskType | null {
	if (typeof value !== 'string') return null;
	return TASK_TYPES.includes(value as TaskType) ? (value as TaskType) : null;
}

export function stripImageMetadata(bytes: Uint8Array, mime: string): Uint8Array {
	if (mime === 'image/jpeg') return stripJpegExif(bytes);
	if (mime === 'image/png') return stripPngMetadata(bytes);
	return bytes;
}

function stripJpegExif(bytes: Uint8Array): Uint8Array {
	if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;

	const chunks: Uint8Array[] = [bytes.slice(0, 2)];
	let offset = 2;
	while (offset + 4 <= bytes.length) {
		if (bytes[offset] !== 0xff) return bytes;
		const marker = bytes[offset + 1];
		if (marker === 0xda) {
			chunks.push(bytes.slice(offset));
			return concatBytes(chunks);
		}

		const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
		if (length < 2 || offset + 2 + length > bytes.length) return bytes;
		const segment = bytes.slice(offset, offset + 2 + length);
		if (marker !== 0xe1) chunks.push(segment);
		offset += 2 + length;
	}

	return concatBytes(chunks);
}

function stripPngMetadata(bytes: Uint8Array): Uint8Array {
	const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	if (bytes.length < 8 || !signature.every((byte, index) => bytes[index] === byte)) return bytes;

	const skipped = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf']);
	const chunks: Uint8Array[] = [bytes.slice(0, 8)];
	let offset = 8;
	while (offset + 12 <= bytes.length) {
		const length =
			(bytes[offset] << 24) |
			(bytes[offset + 1] << 16) |
			(bytes[offset + 2] << 8) |
			bytes[offset + 3];
		const chunkEnd = offset + 12 + length;
		if (length < 0 || chunkEnd > bytes.length) return bytes;

		const type = String.fromCharCode(
			bytes[offset + 4],
			bytes[offset + 5],
			bytes[offset + 6],
			bytes[offset + 7]
		);
		if (!skipped.has(type)) chunks.push(bytes.slice(offset, chunkEnd));
		offset = chunkEnd;
		if (type === 'IEND') break;
	}

	return concatBytes(chunks);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
	const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
	const output = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.length;
	}
	return output;
}
