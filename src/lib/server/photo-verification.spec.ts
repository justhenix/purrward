import { describe, expect, it } from 'vitest';
import {
	buildGeminiVerificationRequest,
	parseGeminiVerification,
	utcDayStart,
	verifyCarePhoto
} from './photo-verification';

function createDatabase(counts: number[], inserts: unknown[]) {
	return {
		select: () => ({
			from: () => ({
				where: async () => [{ value: counts.shift() ?? 0 }]
			})
		}),
		transaction: async (
			callback: (tx: {
				insert: () => { values: (value: unknown) => Promise<void> };
				update: () => { set: () => { where: () => Promise<void> } };
			}) => Promise<void>
		) =>
			callback({
				insert: () => ({
					values: async (value: unknown) => {
						inserts.push(value);
					}
				}),
				update: () => ({
					set: () => ({
						where: async () => undefined
					})
				})
			})
	} as unknown as Parameters<typeof verifyCarePhoto>[0]['database'];
}

describe('photo verification', () => {
	it('uses UTC day boundary', () => {
		expect(utcDayStart(Date.UTC(2026, 5, 29, 18))).toBe(Date.UTC(2026, 5, 29));
	});

	it('builds inline Gemini image request', () => {
		const request = buildGeminiVerificationRequest({
			imageBytes: new Uint8Array([1, 2, 3]),
			mime: 'image/png',
			taskType: 'feeding',
			model: 'gemini-3.5-flash'
		});

		expect(request.model).toBe('gemini-3.5-flash');
		expect(request.input[1]).toEqual({ type: 'image', data: 'AQID', mime_type: 'image/png' });
	});

	it('parses valid Gemini JSON output', () => {
		expect(
			parseGeminiVerification({ output_text: '{"verified":true,"reason":"cat bowl"}' })
		).toEqual({
			verified: true,
			reason: 'cat bowl'
		});
		expect(parseGeminiVerification({ output_text: 'nope' })).toBeNull();
	});

	it('rejects unactionable uploads before Gemini call', async () => {
		const formData = new FormData();
		formData.set('taskType', 'feeding');
		const result = await verifyCarePhoto({
			userId: 'user-1',
			formData,
			database: createDatabase([], []),
			fetcher: fetch,
			apiKey: 'key'
		});

		expect(result.status).toBe(400);
		expect(result.body.error).toBe('Photo is required.');
	});

	it('returns rate limit before Gemini call', async () => {
		const formData = new FormData();
		formData.set('taskType', 'feeding');
		formData.set('photo', new File([new Uint8Array([1])], 'cat.png', { type: 'image/png' }));
		const result = await verifyCarePhoto({
			userId: 'user-1',
			formData,
			database: createDatabase([20], []),
			fetcher: fetch,
			apiKey: 'key'
		});

		expect(result.status).toBe(429);
		expect(result.body.error).toBe('Daily upload limit reached.');
	});

	it('awards points for verified care', async () => {
		const formData = new FormData();
		const inserts: unknown[] = [];
		formData.set('taskType', 'feeding');
		formData.set('photo', new File([new Uint8Array([1])], 'cat.png', { type: 'image/png' }));
		const fetcher = async () =>
			new Response(JSON.stringify({ output_text: '{"verified":true,"reason":"cat bowl"}' }));

		const result = await verifyCarePhoto({
			userId: 'user-1',
			formData,
			database: createDatabase([0, 0], inserts),
			fetcher,
			apiKey: 'key',
			now: Date.UTC(2026, 5, 29)
		});

		expect(result).toEqual({
			status: 200,
			body: { verified: true, reason: 'cat bowl', pointsAwarded: 10 }
		});
		expect(inserts).toHaveLength(1);
	});
});
