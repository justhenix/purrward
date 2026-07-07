// SECURITY: matches cat photos to the fixed local avatar catalog without storing uploads.
import { CAT_AVATARS } from '$lib/cat-avatars';
import { isCatAvatarId, type CatAvatarId } from '$lib/avatar-ids';
import { bytesToBase64, extractGeminiText } from './photo-verification';
import { sanitize } from './security';

type Fetcher = typeof fetch;

const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const CONFIDENCE = ['good', 'close'] as const;

export type AvatarMatchConfidence = (typeof CONFIDENCE)[number];
export type AvatarMatchResponse =
	| { matched: true; avatarId: CatAvatarId; confidence: AvatarMatchConfidence; reason: string }
	| { matched: false; reason: string };

type CatalogEntry = {
	id: CatAvatarId;
	name: string;
	matchDescription: string;
	traits: readonly string[];
};

export const AVATAR_MATCH_CATALOG: readonly CatalogEntry[] = CAT_AVATARS.map((avatar) => ({
	id: avatar.id,
	name: avatar.name,
	traits: avatar.traits,
	matchDescription: avatar.matchDescription
}));

function cleanReason(value: unknown, fallback: string): string {
	if (typeof value !== 'string') return fallback;
	const reason = sanitize(value).trim();
	return reason ? reason.slice(0, 160) : fallback;
}

export function parseAvatarMatch(payload: unknown): AvatarMatchResponse | null {
	const text = extractGeminiText(payload);
	if (!text) return null;

	try {
		const parsed = JSON.parse(text) as {
			matched?: unknown;
			avatarId?: unknown;
			confidence?: unknown;
			reason?: unknown;
		};
		if (parsed.matched === false) {
			return { matched: false, reason: cleanReason(parsed.reason, 'No close avatar match.') };
		}
		if (parsed.matched !== true || typeof parsed.avatarId !== 'string') return null;
		if (!isCatAvatarId(parsed.avatarId)) return null;
		const allowed = AVATAR_MATCH_CATALOG.some((avatar) => avatar.id === parsed.avatarId);
		if (!allowed) return null;
		const confidence = CONFIDENCE.includes(parsed.confidence as AvatarMatchConfidence)
			? (parsed.confidence as AvatarMatchConfidence)
			: 'close';
		return {
			matched: true,
			avatarId: parsed.avatarId,
			confidence,
			reason: cleanReason(parsed.reason, 'Closest avatar match.')
		};
	} catch {
		return null;
	}
}

export function buildGeminiAvatarMatchRequest(input: { imageBytes: Uint8Array; mime: string }) {
	const catalog = AVATAR_MATCH_CATALOG.map(({ id, name, traits, matchDescription }) => ({
		id,
		name,
		traits,
		matchDescription
	}));

	// SECURITY: server-owned prompt; catalog is fixed and the image is sanitized before this call.
	return {
		contents: [
			{
				parts: [
					{
						text:
							'You match a cat photo to the closest existing Purrward avatar. This is not breed detection. Choose only from the provided avatar catalog. If no avatar is visually close, return matched false. Return strict JSON only. Do not guess breed. Do not invent new avatars. Do not describe medical conditions. Do not identify people. Do not store the photo. Catalog: ' +
							JSON.stringify(catalog)
					},
					{
						inlineData: {
							mimeType: input.mime,
							data: bytesToBase64(input.imageBytes)
						}
					}
				]
			}
		],
		generationConfig: {
			maxOutputTokens: 160,
			temperature: 0,
			thinkingConfig: { thinkingBudget: 0 },
			responseMimeType: 'application/json',
			responseSchema: {
				type: 'object',
				properties: {
					matched: { type: 'boolean' },
					avatarId: { type: 'string', enum: catalog.map((avatar) => avatar.id) },
					confidence: { type: 'string', enum: [...CONFIDENCE] },
					reason: { type: 'string' }
				},
				required: ['matched', 'reason']
			}
		}
	};
}

async function callGemini(input: {
	fetcher: Fetcher;
	apiKey: string;
	imageBytes: Uint8Array;
	mime: string;
	model?: string;
}): Promise<AvatarMatchResponse | null> {
	const model = input.model ?? DEFAULT_GEMINI_MODEL;
	const response = await input.fetcher(
		`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': input.apiKey
			},
			body: JSON.stringify(
				buildGeminiAvatarMatchRequest({ imageBytes: input.imageBytes, mime: input.mime })
			)
		}
	);
	if (!response.ok) return null;
	return parseAvatarMatch(await response.json());
}

export async function matchCatAvatar(input: {
	fetcher: Fetcher;
	apiKey: string;
	imageBytes: Uint8Array;
	mime: string;
	model?: string;
}): Promise<{ status: number; body: AvatarMatchResponse | { error: string } }> {
	const result = await callGemini(input);
	if (!result) return { status: 502, body: { error: "Couldn't scan. Choose manually." } };
	return { status: 200, body: result };
}
