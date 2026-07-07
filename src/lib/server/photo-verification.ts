// SECURITY: verifies care photos and records server-owned points.
import { and, count, eq, sql } from 'drizzle-orm';
import { cats, habitCompletions, users } from './db/schema';
import { SANDBOX_POINTS_PER_PROOF } from './sandbox';
import {
	stripImageMetadata,
	validateTaskType,
	validateUpload,
	type CareMode,
	type TaskType
} from './security';

type Database = typeof import('./db').db;
type Fetcher = typeof fetch;

const POINTS_PER_VERIFICATION = 10;
const MAX_UPLOADS_PER_DAY = 20;
const MAX_VERIFIED_TASKS_PER_DAY = 6;
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

type GeminiVerification = {
	verified: boolean;
	reason: string;
};

export type VerificationResponse = {
	status: number;
	body: { verified?: boolean; reason?: string; pointsAwarded?: number; error?: string };
};

class LimitExceededError extends Error {
	constructor(readonly response: VerificationResponse) {
		super(response.body.error);
	}
}

export function utcDayStart(timestamp = Date.now()): number {
	const date = new Date(timestamp);
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	const chunkSize = 0x8000;
	for (let index = 0; index < bytes.length; index += chunkSize) {
		binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
	}
	return btoa(binary);
}

export function parseGeminiVerification(payload: unknown): GeminiVerification | null {
	const text = extractGeminiText(payload);
	if (!text) return null;

	try {
		const parsed = JSON.parse(text) as { verified?: unknown; reason?: unknown };
		if (typeof parsed.verified !== 'boolean' || typeof parsed.reason !== 'string') return null;
		return { verified: parsed.verified, reason: parsed.reason.slice(0, 240) };
	} catch {
		return null;
	}
}

export function extractGeminiText(payload: unknown): string | null {
	if (!payload || typeof payload !== 'object') return null;
	const record = payload as Record<string, unknown>;
	if (typeof record.output_text === 'string') return record.output_text;

	const outputs = record.outputs;
	if (Array.isArray(outputs)) {
		const textOutput = outputs.find(
			(output): output is { text: string } =>
				typeof output === 'object' &&
				output !== null &&
				typeof (output as { text?: unknown }).text === 'string'
		);
		if (textOutput) return textOutput.text;
	}

	const steps = record.steps;
	if (Array.isArray(steps)) {
		const step = steps.find(
			(item): item is { content: unknown[] } =>
				typeof item === 'object' &&
				item !== null &&
				Array.isArray((item as { content?: unknown }).content)
		);
		const textContent = step?.content.find(
			(item): item is { text: string } =>
				typeof item === 'object' &&
				item !== null &&
				typeof (item as { text?: unknown }).text === 'string'
		);
		if (textContent) return textContent.text;
	}

	const candidates = record.candidates;
	if (Array.isArray(candidates)) {
		const parts = (candidates[0] as { content?: { parts?: { text?: string }[] } } | undefined)
			?.content?.parts;
		const textPart = parts?.find((part) => typeof part.text === 'string');
		if (textPart?.text) return textPart.text;
	}

	return null;
}

export function buildGeminiVerificationRequest(input: {
	imageBytes: Uint8Array;
	mime: string;
	taskType: TaskType;
}) {
	const taskLabels: Record<TaskType, string> = {
		feeding: 'feeding or food bowl care',
		water: 'fresh water or hydration care',
		litter: 'litter box care',
		play: 'play or enrichment activity',
		grooming: 'grooming care',
		meds: 'medication care',
		street_feeding: 'street or community cat feeding',
		shelter_care: 'outdoor shelter or community cat shelter care'
	};

	// SECURITY: server-owned prompt; user input is limited to the validated task label.
	return {
		contents: [
			{
				parts: [
					{
						text:
							'You verify cat wellness care photos for Purrward. Return only compact JSON with keys verified and reason. Verify only if the image plausibly shows a cat-related care task matching this requested task. Reject non-cats, screenshots, unrelated images, stock-looking images, or low-confidence matches. Requested task: ' +
							taskLabels[input.taskType]
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
			maxOutputTokens: 128,
			temperature: 0,
			thinkingConfig: { thinkingBudget: 0 },
			responseMimeType: 'application/json',
			responseSchema: {
				type: 'object',
				properties: {
					verified: { type: 'boolean' },
					reason: { type: 'string' }
				},
				required: ['verified', 'reason']
			}
		}
	};
}

async function callGemini(input: {
	fetcher: Fetcher;
	apiKey: string;
	imageBytes: Uint8Array;
	mime: string;
	taskType: TaskType;
	model?: string;
}): Promise<GeminiVerification | null> {
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
				buildGeminiVerificationRequest({
					imageBytes: input.imageBytes,
					mime: input.mime,
					taskType: input.taskType
				})
			)
		}
	);
	if (!response.ok) return null;
	return parseGeminiVerification(await response.json());
}

async function checkLimits(input: {
	database: Database;
	userId: string;
	catId: string;
	taskType: TaskType;
	now: number;
}): Promise<VerificationResponse | null> {
	// simplify: UTC day boundary; switch to user timezone if streak UX needs it.
	const dayStart = utcDayStart(input.now);
	// Upload cap stays per user (Req: 20/day per user).
	const uploadRows = await input.database
		.select({ value: count() })
		.from(habitCompletions)
		.where(and(eq(habitCompletions.userId, input.userId), eq(habitCompletions.dayStart, dayStart)));
	if ((uploadRows[0]?.value ?? 0) >= MAX_UPLOADS_PER_DAY) {
		return { status: 429, body: { error: 'Daily upload limit reached.' } };
	}

	// SECURITY: verified-task cap is per-cat so caps stay independent across a user's cats.
	const taskRows = await input.database
		.select({ value: count() })
		.from(habitCompletions)
		.where(
			and(
				eq(habitCompletions.userId, input.userId),
				eq(habitCompletions.catId, input.catId),
				eq(habitCompletions.taskType, input.taskType),
				eq(habitCompletions.verified, 1),
				eq(habitCompletions.dayStart, dayStart)
			)
		);
	if ((taskRows[0]?.value ?? 0) >= MAX_VERIFIED_TASKS_PER_DAY) {
		return { status: 429, body: { error: 'Daily task limit reached.' } };
	}

	return null;
}

async function recordVerification(input: {
	database: Database;
	userId: string;
	catId: string;
	taskType: TaskType;
	result: GeminiVerification;
	now: number;
}): Promise<number> {
	const pointsAwarded = input.result.verified ? POINTS_PER_VERIFICATION : 0;
	const dayStart = utcDayStart(input.now);
	await input.database.transaction(async (tx) => {
		const uploadRows = await tx
			.select({ value: count() })
			.from(habitCompletions)
			.where(
				and(eq(habitCompletions.userId, input.userId), eq(habitCompletions.dayStart, dayStart))
			);
		if ((uploadRows[0]?.value ?? 0) >= MAX_UPLOADS_PER_DAY) {
			throw new LimitExceededError({ status: 429, body: { error: 'Daily upload limit reached.' } });
		}

		if (input.result.verified) {
			const taskRows = await tx
				.select({ value: count() })
				.from(habitCompletions)
				.where(
					and(
						eq(habitCompletions.userId, input.userId),
						eq(habitCompletions.catId, input.catId),
						eq(habitCompletions.taskType, input.taskType),
						eq(habitCompletions.verified, 1),
						eq(habitCompletions.dayStart, dayStart)
					)
				);
			if ((taskRows[0]?.value ?? 0) >= MAX_VERIFIED_TASKS_PER_DAY) {
				throw new LimitExceededError({ status: 429, body: { error: 'Daily task limit reached.' } });
			}
		}

		await tx.insert(habitCompletions).values({
			userId: input.userId,
			catId: input.catId,
			taskType: input.taskType,
			verified: input.result.verified ? 1 : 0,
			pointsAwarded,
			reason: input.result.reason,
			dayStart,
			createdAt: input.now
		});
		if (pointsAwarded > 0) {
			// SECURITY: server-owned points; user balance and per-cat attribution move atomically.
			await tx
				.update(users)
				.set({ purrpoints: sql`${users.purrpoints} + ${pointsAwarded}` })
				.where(eq(users.id, input.userId));
			await tx
				.update(cats)
				.set({ purrpoints: sql`${cats.purrpoints} + ${pointsAwarded}` })
				.where(and(eq(cats.id, input.catId), eq(cats.userId, input.userId)));
		}
	});
	return pointsAwarded;
}

export async function verifyCarePhoto(input: {
	userId: string;
	catId: string; // SECURITY: an already ownership-authorized active cat id, resolved server-side
	formData: FormData;
	database: Database;
	fetcher: Fetcher;
	apiKey: string;
	model?: string;
	careMode?: CareMode;
	now?: number;
}): Promise<VerificationResponse> {
	const photo = input.formData.get('photo');
	const taskType = validateTaskType(input.formData.get('taskType'), input.careMode);
	if (!(photo instanceof File)) return { status: 400, body: { error: 'Photo is required.' } };
	if (!taskType) return { status: 400, body: { error: 'Choose a valid care task.' } };

	const now = input.now ?? Date.now();
	const limit = await checkLimits({
		database: input.database,
		userId: input.userId,
		catId: input.catId,
		taskType,
		now
	});
	if (limit) return limit;

	const upload = validateUpload(photo);
	if (!upload.ok) return { status: 400, body: { error: upload.error } };

	const imageBytes = stripImageMetadata(new Uint8Array(await photo.arrayBuffer()), photo.type);
	const result = await callGemini({
		fetcher: input.fetcher,
		apiKey: input.apiKey,
		imageBytes,
		mime: photo.type,
		taskType,
		model: input.model
	});
	if (!result) {
		try {
			await recordVerification({
				database: input.database,
				userId: input.userId,
				catId: input.catId,
				taskType,
				result: { verified: false, reason: 'Verification failed. Please try again.' },
				now
			});
		} catch (error) {
			if (error instanceof LimitExceededError) return error.response;
			throw error;
		}
		return { status: 502, body: { error: 'Verification failed. Please try again.' } };
	}

	try {
		const pointsAwarded = await recordVerification({
			database: input.database,
			userId: input.userId,
			catId: input.catId,
			taskType,
			result,
			now
		});
		return { status: 200, body: { ...result, pointsAwarded } };
	} catch (error) {
		if (error instanceof LimitExceededError) return error.response;
		throw error;
	}
}

export async function verifySandboxCarePhoto(input: {
	formData: FormData;
	fetcher: Fetcher;
	apiKey: string;
	model?: string;
}): Promise<VerificationResponse & { taskType?: TaskType }> {
	const photo = input.formData.get('photo');
	const taskType = validateTaskType(input.formData.get('taskType'));
	if (!(photo instanceof File)) return { status: 400, body: { error: 'Photo is required.' } };
	if (!taskType) return { status: 400, body: { error: 'Choose a valid care task.' } };

	const upload = validateUpload(photo);
	if (!upload.ok) return { status: 400, body: { error: upload.error } };

	const imageBytes = stripImageMetadata(new Uint8Array(await photo.arrayBuffer()), photo.type);
	const result = await callGemini({
		fetcher: input.fetcher,
		apiKey: input.apiKey,
		imageBytes,
		mime: photo.type,
		taskType,
		model: input.model
	});
	if (!result) return { status: 502, body: { error: 'Verification failed. Please try again.' } };

	return {
		status: 200,
		taskType,
		body: {
			...result,
			pointsAwarded: result.verified ? SANDBOX_POINTS_PER_PROOF : 0
		}
	};
}
