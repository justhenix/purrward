// SECURITY: authenticated, rate-limited AI vet triage endpoint with sandboxed prompts.
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { cleanVetQuestion, triageVetQuestion } from '$lib/server/vet-triage';
import { checkRateLimit, hashRateKey } from '$lib/server/rate-limit';
import { getActiveCat } from '$lib/server/cats';
import { DAY_MS, DEFAULT_VET_DAILY_LIMIT, parsePositiveInt } from '$lib/server/rate-limit-config';

export const POST: RequestHandler = async ({ request, fetch, locals }) => {
	// SECURITY: never accept a client-supplied user id; require an authenticated session.
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

	const formData = await request.formData();
	const question = cleanVetQuestion(formData.get('question'));
	if (!question)
		return Response.json({ error: 'Ask a short cat health question.' }, { status: 400 });

	if (!env.GEMINI_API_KEY) {
		return Response.json({ error: 'Vet triage is not configured.' }, { status: 500 });
	}

	const { db } = await import('$lib/server/db');

	// SECURITY: 50 messages/day per user (Retry-After on block).
	const limit = await checkRateLimit({
		database: db,
		key: await hashRateKey(locals.user.id),
		action: 'vet_triage',
		limit: parsePositiveInt(
			env.AI_VET_DAILY_LIMIT ?? env.GEMINI_VET_DAILY_LIMIT,
			DEFAULT_VET_DAILY_LIMIT
		),
		windowMs: DAY_MS
	});
	if (!limit.allowed) {
		return Response.json(
			{ error: 'Daily vet chat limit reached. Try again tomorrow.' },
			{ status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
		);
	}

	const activeCat = await getActiveCat(db, locals.user.id);
	const result = await triageVetQuestion({
		question,
		fetcher: fetch,
		apiKey: env.GEMINI_API_KEY,
		model: env.GEMINI_VET_MODEL || env.GEMINI_MODEL || undefined,
		catName: activeCat?.name
	});

	return Response.json(result.body, { status: result.status });
};
