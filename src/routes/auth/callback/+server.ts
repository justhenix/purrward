// SECURITY: Google OAuth callback — exchanges code for tokens, creates session
// Implementation: tomorrow
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// ponytail: placeholder until Google OAuth client ID configured
	return new Response('OAuth callback not configured yet', { status: 501 });
};
