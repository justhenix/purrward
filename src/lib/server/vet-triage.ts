// SECURITY: server-owned AI vet triage prompt and response parsing.
import { sanitize } from './security';

type Fetcher = typeof fetch;

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

export type VetTriageResponse = {
	status: number;
	body: { reply?: string; error?: string };
};

function extractText(payload: unknown): string | null {
	if (!payload || typeof payload !== 'object') return null;
	const record = payload as Record<string, unknown>;
	if (typeof record.output_text === 'string') return record.output_text;

	const candidates = record.candidates;
	if (Array.isArray(candidates)) {
		const parts = (candidates[0] as { content?: { parts?: { text?: string }[] } } | undefined)
			?.content?.parts;
		const textPart = parts?.find((part) => typeof part.text === 'string');
		if (textPart?.text) return textPart.text;
	}

	const outputs = record.outputs;
	if (Array.isArray(outputs)) {
		const output = outputs.find(
			(item): item is { text: string } =>
				typeof item === 'object' &&
				item !== null &&
				typeof (item as { text?: unknown }).text === 'string'
		);
		if (output) return output.text;
	}

	return null;
}

function cleanQuestion(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const cleaned = sanitize(value).replace(/\s+/g, ' ').trim();
	if (cleaned.length < 3 || cleaned.length > 600) return null;
	return cleaned;
}

export function buildVetTriageRequest(input: { question: string; model?: string }) {
	return {
		model: input.model ?? DEFAULT_GEMINI_MODEL,
		input: [
			{
				type: 'text',
				text:
					'You are Purrward AI Vet Triage for cat owners. Give calm, brief supportive guidance in 3 short parts: likely concern, what to monitor, when to seek urgent vet care. Do not diagnose, prescribe, or replace a veterinarian. Mention emergency care for breathing difficulty, collapse, seizures, poisoning, severe bleeding, blocked urination, or extreme lethargy. User concern: ' +
					input.question
			}
		]
	};
}

export async function triageVetQuestion(input: {
	question: unknown;
	fetcher: Fetcher;
	apiKey: string;
	model?: string;
}): Promise<VetTriageResponse> {
	const question = cleanQuestion(input.question);
	if (!question) return { status: 400, body: { error: 'Ask a short cat health question.' } };

	const response = await input.fetcher(
		'https://generativelanguage.googleapis.com/v1beta/interactions',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': input.apiKey
			},
			body: JSON.stringify(buildVetTriageRequest({ question, model: input.model }))
		}
	);

	if (!response.ok) return { status: 502, body: { error: 'Vet triage is unavailable right now.' } };

	const reply = extractText(await response.json())
		?.slice(0, 900)
		.trim();
	if (!reply) return { status: 502, body: { error: 'Vet triage returned no guidance.' } };

	return { status: 200, body: { reply } };
}
