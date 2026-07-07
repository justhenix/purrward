// SECURITY: input sanitization, rate limiting, security utilities
import {
	COMMUNITY_TASK_TYPES,
	OWNED_TASK_TYPES,
	habitSetFor,
	isTaskType,
	type CareMode,
	type TaskType
} from '$lib/tasks';

export { COMMUNITY_TASK_TYPES, OWNED_TASK_TYPES, habitSetFor };
export type { CareMode, TaskType };

/** SECURITY: strip HTML tags to prevent XSS */
export function sanitize(input: string): string {
	return Array.from(input.replace(/[<>]/g, ''), (char) => {
		const code = char.charCodeAt(0);
		return code !== 10 && (code < 32 || code === 127) ? ' ' : char;
	}).join('');
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

// careMode restricts the accepted set; omit it to accept any known task type.
export function validateTaskType(
	value: FormDataEntryValue | null,
	careMode?: CareMode
): TaskType | null {
	if (typeof value !== 'string') return null;
	if (careMode) {
		const allowed: readonly string[] = habitSetFor(careMode);
		return allowed.includes(value) ? (value as TaskType) : null;
	}
	return isTaskType(value) ? value : null;
}

export function stripImageMetadata(bytes: Uint8Array, mime: string): Uint8Array {
	if (mime === 'image/jpeg') return stripJpegExif(bytes);
	if (mime === 'image/png') return stripPngMetadata(bytes);
	if (mime === 'image/webp') return stripWebpMetadata(bytes);
	return bytes;
}

// SECURITY: drop EXIF/XMP chunks from a RIFF/WEBP container before the image reaches Gemini.
export function stripWebpMetadata(bytes: Uint8Array): Uint8Array {
	// RIFF header: 'RIFF' <u32 size> 'WEBP'. Fail safe (return original) if malformed.
	if (bytes.length < 12) return bytes;
	const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
	const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
	if (riff !== 'RIFF' || webp !== 'WEBP') return bytes;

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const skipped = new Set(['EXIF', 'XMP ']);
	const kept: Uint8Array[] = [];
	let offset = 12;
	while (offset + 8 <= bytes.length) {
		const fourcc = String.fromCharCode(
			bytes[offset],
			bytes[offset + 1],
			bytes[offset + 2],
			bytes[offset + 3]
		);
		const size = view.getUint32(offset + 4, true);
		const padded = size + (size % 2); // chunks are padded to even size
		const chunkEnd = offset + 8 + padded;
		if (padded < 0 || chunkEnd > bytes.length) return bytes; // malformed → fail safe
		if (!skipped.has(fourcc)) kept.push(bytes.slice(offset, chunkEnd));
		offset = chunkEnd;
	}

	const payload = concatBytes(kept);
	const output = new Uint8Array(12 + payload.length);
	output.set(bytes.slice(0, 12));
	output.set(payload, 12);
	// Recompute RIFF size = 'WEBP' fourcc (4) + payload bytes.
	new DataView(output.buffer).setUint32(4, 4 + payload.length, true);
	return output;
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
