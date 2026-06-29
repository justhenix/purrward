// SECURITY: Google OAuth initiation — redirects to Google consent screen
// Implementation: tomorrow
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// ponytail: placeholder until Google OAuth client ID configured
	return new Response('OAuth not configured yet', { status: 501 });
};
