// SECURITY: rate-limited onboarding avatar match endpoint; uploads are processed, not stored.
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { matchCatAvatar } from '$lib/server/avatar-match';
import { checkRateLimit, hashRateKey } from '$lib/server/rate-limit';
import { stripImageMetadata, validateUpload } from '$lib/server/security';

const HOUR_MS = 60 * 60 * 1000;

async function enforceAvatarMatchLimit(input: {
	userId: string | null;
	getClientAddress: () => string;
}): Promise<Response | null> {
	const { db } = await import('$lib/server/db');
	let rawKey = input.userId ? `user:${input.userId}` : 'ip:unknown';
	if (!input.userId) {
		try {
			rawKey = `ip:${input.getClientAddress()}`;
		} catch {
			rawKey = 'ip:unknown';
		}
	}
	const key = await hashRateKey(rawKey);
	// SECURITY: onboarding scan is optional; keep a small per-user/IP hourly budget.
	const decision = await checkRateLimit({
		database: db,
		key,
		action: 'avatar_match',
		limit: 12,
		windowMs: HOUR_MS
	});
	if (decision.allowed) return null;
	return Response.json(
		{ error: 'Too many scans. Choose manually.' },
		{ status: 429, headers: { 'Retry-After': String(decision.retryAfter) } }
	);
}

export const POST: RequestHandler = async ({ fetch, getClientAddress, locals, request }) => {
	if (!locals.user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

	const limited = await enforceAvatarMatchLimit({
		userId: locals.user.id,
		getClientAddress
	});
	if (limited) return limited;

	const formData = await request.formData();
	const image = formData.get('image') ?? formData.get('photo');
	if (!(image instanceof File)) {
		return Response.json({ error: 'Photo is required.' }, { status: 400 });
	}

	const upload = validateUpload(image);
	if (!upload.ok) {
		return Response.json({ error: upload.error }, { status: 400 });
	}

	if (!env.GEMINI_API_KEY) {
		return Response.json({ error: "Couldn't scan. Choose manually." }, { status: 503 });
	}

	const imageBytes = stripImageMetadata(new Uint8Array(await image.arrayBuffer()), image.type);
	const result = await matchCatAvatar({
		fetcher: fetch,
		apiKey: env.GEMINI_API_KEY,
		imageBytes,
		mime: image.type,
		model: env.GEMINI_MODEL || undefined
	});
	return Response.json(result.body, { status: result.status });
};
