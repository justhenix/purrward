// SECURITY: session validation, cookie management, auth utilities
// All auth state server-side only. Never expose tokens to client.

export function validateSession(sessionId: string): boolean {
	// ponytail: stub — implement with Turso lookup tomorrow
	return false;
}

export function createSessionCookie(sessionId: string): string {
	// SECURITY: HttpOnly, Secure, SameSite=Strict
	return `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`;
}
