// SECURITY: authenticated photo verification endpoint for care tasks.
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { verifyCarePhoto } from '$lib/server/photo-verification';

export const POST: RequestHandler = async ({ locals, request, fetch }) => {
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });
	if (!env.GEMINI_API_KEY) {
		return Response.json({ error: 'Verification is not configured.' }, { status: 500 });
	}

	const { db } = await import('$lib/server/db');
	const result = await verifyCarePhoto({
		userId: locals.user.id,
		formData: await request.formData(),
		database: db,
		fetcher: fetch,
		apiKey: env.GEMINI_API_KEY,
		model: env.GEMINI_MODEL
	});
	return Response.json(result.body, { status: result.status });
};
