import { describe, expect, it } from 'vitest';
import {
	buildGeminiVerificationRequest,
	parseGeminiVerification,
	utcDayStart,
	verifyCarePhoto,
	verifySandboxCarePhoto
} from './photo-verification';

type CountSelect = () => { from: () => { where: () => Promise<{ value: number }[]> } };

function createCountSelect(counts: number[]): CountSelect {
	return () => ({
		from: () => ({
			where: async () => [{ value: counts.shift() ?? 0 }]
		})
	});
}

function createDatabase(
	counts: number[],
	inserts: unknown[],
	txCounts: number[] = [],
	updates: unknown[] = []
) {
	return {
		select: createCountSelect(counts),
		transaction: async (
			callback: (tx: {
				select: CountSelect;
				insert: () => { values: (value: unknown) => Promise<void> };
				update: () => { set: () => { where: (value?: unknown) => Promise<void> } };
			}) => Promise<void>
		) =>
			callback({
				select: createCountSelect(txCounts),
				insert: () => ({
					values: async (value: unknown) => {
						inserts.push(value);
					}
				}),
				update: () => ({
					set: () => ({
						where: async (value?: unknown) => {
							updates.push(value);
						}
					})
				})
			})
	} as unknown as Parameters<typeof verifyCarePhoto>[0]['database'];
}

function createValidFormData(taskType = 'feeding') {
	const formData = new FormData();
	formData.set('taskType', taskType);
	formData.set('photo', new File([new Uint8Array([1])], 'cat.png', { type: 'image/png' }));
	return formData;
}

describe('photo verification', () => {
	it('uses UTC day boundary', () => {
		expect(utcDayStart(Date.UTC(2026, 5, 29, 18))).toBe(Date.UTC(2026, 5, 29));
	});

	it('builds inline Gemini generateContent image request', () => {
		const request = buildGeminiVerificationRequest({
			imageBytes: new Uint8Array([1, 2, 3]),
			mime: 'image/png',
			taskType: 'feeding'
		});

		expect(request.contents[0].parts[1]).toEqual({
			inlineData: { mimeType: 'image/png', data: 'AQID' }
		});
		expect(request.generationConfig.maxOutputTokens).toBe(128);
		expect(request.generationConfig.thinkingConfig.thinkingBudget).toBe(0);
		expect(request.generationConfig.responseMimeType).toBe('application/json');
	});

	it('parses valid Gemini JSON output', () => {
		expect(
			parseGeminiVerification({ output_text: '{"verified":true,"reason":"cat bowl"}' })
		).toEqual({
			verified: true,
			reason: 'cat bowl'
		});
		expect(
			parseGeminiVerification({
				steps: [{ content: [{ text: '{"verified":true,"reason":"fresh water bowl"}' }] }]
			})
		).toEqual({
			verified: true,
			reason: 'fresh water bowl'
		});
		expect(parseGeminiVerification({ output_text: 'nope' })).toBeNull();
	});

	it('rejects unactionable uploads before Gemini call', async () => {
		const formData = new FormData();
		formData.set('taskType', 'feeding');
		const result = await verifyCarePhoto({
			userId: 'user-1',
			catId: 'cat-1',
			formData,
			database: createDatabase([], []),
			fetcher: fetch,
			apiKey: 'key'
		});

		expect(result.status).toBe(400);
		expect(result.body.error).toBe('Photo is required.');
	});

	it('returns rate limit before Gemini call', async () => {
		const result = await verifyCarePhoto({
			userId: 'user-1',
			catId: 'cat-1',
			formData: createValidFormData(),
			database: createDatabase([20], []),
			fetcher: fetch,
			apiKey: 'key'
		});

		expect(result.status).toBe(429);
		expect(result.body.error).toBe('Daily upload limit reached.');
	});

	it('awards points for verified care', async () => {
		const inserts: unknown[] = [];
		const updates: unknown[] = [];
		const fetcher = async () =>
			new Response(JSON.stringify({ output_text: '{"verified":true,"reason":"cat bowl"}' }));
		const now = Date.UTC(2026, 5, 29, 12);

		const result = await verifyCarePhoto({
			userId: 'user-1',
			catId: 'cat-1',
			formData: createValidFormData(),
			database: createDatabase([0, 0], inserts, [0, 0], updates),
			fetcher,
			apiKey: 'key',
			now
		});

		expect(result).toEqual({
			status: 200,
			body: { verified: true, reason: 'cat bowl', pointsAwarded: 10 }
		});
		expect(inserts).toEqual([
			{
				userId: 'user-1',
				catId: 'cat-1',
				taskType: 'feeding',
				verified: 1,
				pointsAwarded: 10,
				reason: 'cat bowl',
				dayStart: Date.UTC(2026, 5, 29),
				createdAt: now
			}
		]);
		// Dual-counter award: users.purrpoints and cats.purrpoints both updated.
		expect(updates).toHaveLength(2);
	});

	it('awards sandbox points only after Gemini verifies', async () => {
		let calls = 0;

		const result = await verifySandboxCarePhoto({
			formData: createValidFormData('play'),
			fetcher: async () => {
				calls += 1;
				return new Response(JSON.stringify({ output_text: '{"verified":true,"reason":"cat toy"}' }));
			},
			apiKey: 'key'
		});

		expect(calls).toBe(1);
		expect(result).toMatchObject({
			status: 200,
			taskType: 'play',
			body: {
				verified: true,
				reason: 'cat toy',
				pointsAwarded: 1000
			}
		});
	});

	it('rejects sandbox non-images before Gemini', async () => {
		const formData = new FormData();
		formData.set('taskType', 'street_feeding');
		formData.set('photo', new File(['demo'], 'proof.mov', { type: 'video/quicktime' }));

		const result = await verifySandboxCarePhoto({
			formData,
			fetcher: async () => {
				throw new Error('Gemini should not be called');
			},
			apiKey: 'key'
		});

		expect(result.status).toBe(400);
		expect(result.body.error).toBe('Invalid file type. Use JPEG, PNG, or WebP.');
	});

	it('rechecks task caps inside the transaction', async () => {
		const inserts: unknown[] = [];
		const updates: unknown[] = [];
		const fetcher = async () =>
			new Response(JSON.stringify({ output_text: '{"verified":true,"reason":"cat bowl"}' }));

		const result = await verifyCarePhoto({
			userId: 'user-1',
			catId: 'cat-1',
			formData: createValidFormData(),
			database: createDatabase([0, 0], inserts, [0, 6], updates),
			fetcher,
			apiKey: 'key',
			now: Date.UTC(2026, 5, 29)
		});

		expect(result.status).toBe(429);
		expect(result.body.error).toBe('Daily task limit reached.');
		expect(inserts).toHaveLength(0);
		expect(updates).toHaveLength(0);
	});

	it('does not record locally invalid uploads', async () => {
		const formData = new FormData();
		const inserts: unknown[] = [];
		formData.set('taskType', 'feeding');
		formData.set('photo', new File([new Uint8Array([1])], 'cat.txt', { type: 'text/plain' }));

		const result = await verifyCarePhoto({
			userId: 'user-1',
			catId: 'cat-1',
			formData,
			database: createDatabase([], inserts),
			fetcher: fetch,
			apiKey: 'key'
		});

		expect(result.status).toBe(400);
		expect(inserts).toHaveLength(0);
	});

	it('records provider failures without awarding points', async () => {
		const inserts: unknown[] = [];
		const updates: unknown[] = [];
		const fetcher = async () => new Response('unavailable', { status: 503 });
		const now = Date.UTC(2026, 5, 29, 12);

		const result = await verifyCarePhoto({
			userId: 'user-1',
			catId: 'cat-1',
			formData: createValidFormData(),
			database: createDatabase([0, 0], inserts, [0], updates),
			fetcher,
			apiKey: 'key',
			now
		});

		expect(result.status).toBe(502);
		expect(result.body.error).toBe('Verification failed. Please try again.');
		expect(inserts).toEqual([
			{
				userId: 'user-1',
				catId: 'cat-1',
				taskType: 'feeding',
				verified: 0,
				pointsAwarded: 0,
				reason: 'Verification failed. Please try again.',
				dayStart: Date.UTC(2026, 5, 29),
				createdAt: now
			}
		]);
		expect(updates).toHaveLength(0);
	});

	it('records unparsable provider responses without awarding points', async () => {
		const inserts: unknown[] = [];
		const updates: unknown[] = [];
		const fetcher = async () => new Response(JSON.stringify({ output_text: 'not json' }));

		const result = await verifyCarePhoto({
			userId: 'user-1',
			catId: 'cat-1',
			formData: createValidFormData(),
			database: createDatabase([0, 0], inserts, [0], updates),
			fetcher,
			apiKey: 'key',
			now: Date.UTC(2026, 5, 29)
		});

		expect(result.status).toBe(502);
		expect(inserts).toHaveLength(1);
		expect(inserts[0]).toMatchObject({ verified: 0, pointsAwarded: 0 });
		expect(updates).toHaveLength(0);
	});
});
