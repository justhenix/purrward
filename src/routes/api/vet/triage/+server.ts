// SECURITY: validates symptom text before calling server-side AI vet triage.
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { triageVetQuestion } from '$lib/server/vet-triage';

export const POST: RequestHandler = async ({ request, fetch }) => {
	if (!env.GEMINI_API_KEY) {
		return Response.json({ error: 'Vet triage is not configured.' }, { status: 500 });
	}

	const formData = await request.formData();
	const result = await triageVetQuestion({
		question: formData.get('question'),
		fetcher: fetch,
		apiKey: env.GEMINI_API_KEY,
		model: env.GEMINI_MODEL
	});

	return Response.json(result.body, { status: result.status });
};
