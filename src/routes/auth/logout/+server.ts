// SECURITY: logout clears server session and browser cookie.
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { clearSessionCookie, shouldUseSecureCookie } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, url }) => {
	if (locals.session) {
		await db.delete(sessions).where(eq(sessions.id, locals.session.id));
	}

	const headers = new Headers();
	headers.set('Location', '/');
	headers.append('Set-Cookie', clearSessionCookie(shouldUseSecureCookie(url)));
	return new Response(null, { status: 303, headers });
};
