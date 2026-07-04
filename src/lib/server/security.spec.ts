import { describe, expect, it } from 'vitest';
import {
	stripImageMetadata,
	stripWebpMetadata,
	validateTaskType,
	validateUpload
} from './security';

function fourcc(text: string): number[] {
	return [...text].map((char) => char.charCodeAt(0));
}

// Builds a minimal RIFF/WEBP container with the given chunks (each padded to even size).
function buildWebp(chunks: { id: string; data: number[] }[]): Uint8Array {
	const body: number[] = [];
	for (const chunk of chunks) {
		const size = chunk.data.length;
		body.push(...fourcc(chunk.id));
		body.push(size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff);
		body.push(...chunk.data);
		if (size % 2 === 1) body.push(0); // padding byte
	}
	const payload = [...fourcc('WEBP'), ...body];
	const riffSize = payload.length;
	return new Uint8Array([
		...fourcc('RIFF'),
		riffSize & 0xff,
		(riffSize >> 8) & 0xff,
		(riffSize >> 16) & 0xff,
		(riffSize >> 24) & 0xff,
		...payload
	]);
}

describe('security helpers', () => {
	it('validates known task types', () => {
		expect(validateTaskType('feeding')).toBe('feeding');
		expect(validateTaskType('bad')).toBeNull();
		expect(validateTaskType(null)).toBeNull();
	});

	it('allows only JPEG and PNG uploads', () => {
		expect(
			validateUpload(new File([new Uint8Array([1])], 'cat.jpg', { type: 'image/jpeg' }))
		).toEqual({
			ok: true
		});
		expect(
			validateUpload(new File([new Uint8Array([1])], 'cat.png', { type: 'image/png' }))
		).toEqual({
			ok: true
		});
		expect(
			validateUpload(new File([new Uint8Array([1])], 'cat.webp', { type: 'image/webp' }))
		).toEqual({
			ok: true
		});
		expect(
			validateUpload(new File([new Uint8Array([1])], 'cat.gif', { type: 'image/gif' }))
		).toEqual({
			ok: false,
			error: 'Invalid file type. Use JPEG, PNG, or WebP.'
		});
	});

	it('strips JPEG APP1 EXIF metadata', () => {
		const jpeg = new Uint8Array([
			0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0x45, 0x78, 0xff, 0xdb, 0x00, 0x04, 0x11, 0x22, 0xff,
			0xda, 0x00, 0x04, 0x33, 0x44, 0x55
		]);

		expect([...stripImageMetadata(jpeg, 'image/jpeg')]).toEqual([
			0xff, 0xd8, 0xff, 0xdb, 0x00, 0x04, 0x11, 0x22, 0xff, 0xda, 0x00, 0x04, 0x33, 0x44, 0x55
		]);
	});

	it('strips PNG text and EXIF chunks', () => {
		const png = new Uint8Array([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x01, 0x49, 0x48, 0x44,
			0x52, 0x01, 0xaa, 0xbb, 0xcc, 0xdd, 0x00, 0x00, 0x00, 0x01, 0x74, 0x45, 0x58, 0x74, 0x02,
			0xaa, 0xbb, 0xcc, 0xdd, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xaa, 0xbb, 0xcc, 0xdd
		]);
		const stripped = stripImageMetadata(png, 'image/png');
		const text = String.fromCharCode(...stripped);

		expect(text).toContain('IHDR');
		expect(text).toContain('IEND');
		expect(text).not.toContain('tEXt');
	});

	it('strips EXIF and XMP chunks from WebP while keeping image data', () => {
		const webp = buildWebp([
			{ id: 'VP8 ', data: [1, 2, 3, 4] },
			{ id: 'EXIF', data: [0xaa, 0xbb] },
			{ id: 'XMP ', data: [0x01, 0x02, 0x03] }
		]);
		const stripped = stripWebpMetadata(webp);
		const text = String.fromCharCode(...stripped);

		expect(text.startsWith('RIFF')).toBe(true);
		expect(text).toContain('WEBP');
		expect(text).toContain('VP8 ');
		expect(text).not.toContain('EXIF');
		expect(text).not.toContain('XMP ');
		// RIFF size field = payload length after the 8-byte RIFF header.
		const view = new DataView(stripped.buffer, stripped.byteOffset, stripped.byteLength);
		expect(view.getUint32(4, true)).toBe(stripped.length - 8);
	});

	it('routes webp mime through stripImageMetadata', () => {
		const webp = buildWebp([
			{ id: 'VP8 ', data: [9, 8, 7, 6] },
			{ id: 'EXIF', data: [0xde, 0xad] }
		]);
		const text = String.fromCharCode(...stripImageMetadata(webp, 'image/webp'));
		expect(text).not.toContain('EXIF');
		expect(text).toContain('VP8 ');
	});

	it('returns malformed webp unchanged (fail safe)', () => {
		const notWebp = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
		expect([...stripWebpMetadata(notWebp)]).toEqual([...notWebp]);
	});
});
