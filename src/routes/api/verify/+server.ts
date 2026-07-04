// SECURITY: authenticated photo verification endpoint for care tasks.
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { verifyCarePhoto, verifySandboxCarePhoto } from '$lib/server/photo-verification';
import { getOrCreateDefaultCat } from '$lib/server/cats';
import { parsePreferences } from '$lib/server/preferences';
import { shouldUseSecureCookie } from '$lib/server/auth';
import {
	parseSandboxTasks,
	SANDBOX_TASKS_COOKIE,
	serializeSandboxTasks
} from '$lib/server/sandbox';

export const POST: RequestHandler = async ({ cookies, locals, request, fetch, url }) => {
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

	const formData = await request.formData();
	const preferences = parsePreferences(cookies.get('purrward_prefs'));
	if (preferences.sandboxMode) {
		const result = await verifySandboxCarePhoto({ formData });
		if (result.status === 200 && result.taskType) {
			const tasks = parseSandboxTasks(cookies.get(SANDBOX_TASKS_COOKIE));
			cookies.set(SANDBOX_TASKS_COOKIE, serializeSandboxTasks([...tasks, result.taskType]), {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: shouldUseSecureCookie(url),
				maxAge: 60 * 60 * 24
			});
		}
		return Response.json(result.body, { status: result.status });
	}

	if (!env.GEMINI_API_KEY) {
		return Response.json({ error: 'Verification is not configured.' }, { status: 500 });
	}

	const { db } = await import('$lib/server/db');
	// SECURITY: active cat is resolved server-side; client never supplies the cat id.
	const activeCat = await getOrCreateDefaultCat(db, locals.user.id);
	const result = await verifyCarePhoto({
		userId: locals.user.id,
		catId: activeCat.id,
		careMode: activeCat.careMode,
		formData,
		database: db,
		fetcher: fetch,
		apiKey: env.GEMINI_API_KEY,
		model: env.GEMINI_MODEL
	});
	return Response.json(result.body, { status: result.status });
};
