// Coverage for server-owned avatar photo matching request and response parsing.
import { describe, expect, it } from 'vitest';
import {
	AVATAR_MATCH_CATALOG,
	buildGeminiAvatarMatchRequest,
	matchCatAvatar,
	parseAvatarMatch
} from './avatar-match';

describe('avatar match', () => {
	it('builds a catalog-bound Gemini request', () => {
		const request = buildGeminiAvatarMatchRequest({
			imageBytes: new Uint8Array([1, 2, 3]),
			mime: 'image/png'
		});

		expect(request.contents[0].parts[1]).toEqual({
			inlineData: { mimeType: 'image/png', data: 'AQID' }
		});
		expect(request.generationConfig.responseMimeType).toBe('application/json');
		expect(request.generationConfig.responseSchema.properties.avatarId.enum).toEqual(
			AVATAR_MATCH_CATALOG.map((avatar) => avatar.id)
		);
		expect(request.contents[0].parts[0].text).toContain('not breed detection');
	});

	it('validates provider avatar ids against the catalog', () => {
		expect(
			parseAvatarMatch({
				output_text:
					'{"matched":true,"avatarId":"tuxedo","confidence":"good","reason":"Black and white coat."}'
			})
		).toEqual({
			matched: true,
			avatarId: 'tuxedo',
			confidence: 'good',
			reason: 'Black and white coat.'
		});
		expect(
			parseAvatarMatch({
				output_text: '{"matched":true,"avatarId":"dragon","confidence":"good","reason":"Invented."}'
			})
		).toBeNull();
	});

	it('returns no-match and provider-failure fallbacks', async () => {
		expect(
			parseAvatarMatch({ output_text: '{"matched":false,"reason":"No close avatar match."}' })
		).toEqual({ matched: false, reason: 'No close avatar match.' });

		const result = await matchCatAvatar({
			fetcher: async () => new Response('unavailable', { status: 503 }),
			apiKey: 'key',
			imageBytes: new Uint8Array([1]),
			mime: 'image/png'
		});
		expect(result).toEqual({
			status: 502,
			body: { error: "Couldn't scan. Choose manually." }
		});
	});
});
