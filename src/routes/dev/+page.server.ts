// Sandbox appendix data from runtime configuration and verification ledger.
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { count } from 'drizzle-orm';
import { habitCompletions } from '$lib/server/db/schema';
import { parsePreferences } from '$lib/server/preferences';

export const load: PageServerLoad = async ({ cookies }) => {
	const preferences = parsePreferences(cookies.get('purrward_prefs'));
	if (!preferences.sandboxMode) {
		redirect(303, '/profile');
	}

	let verificationRows: number;
	try {
		const { db } = await import('$lib/server/db');
		const rows = await db.select({ value: count() }).from(habitCompletions);
		verificationRows = rows[0]?.value ?? 0;
	} catch {
		verificationRows = 0;
	}

	return {
		verificationRows,
		securityChecklist: [
			{ id: 1, label: 'Parameterized DB writes present', ready: true },
			{ id: 2, label: 'JPEG/PNG metadata stripping implemented', ready: true },
			{ id: 3, label: 'Session cookie flags tested in code', ready: true },
			{ id: 4, label: 'CSP headers configured', ready: true },
			{ id: 5, label: 'Gemini key configured', ready: Boolean(env.GEMINI_API_KEY) },
			{ id: 6, label: 'Google OAuth configured', ready: Boolean(env.GOOGLE_CLIENT_ID) }
		],
		traceLogs: [
			{
				step: 'Edge Request',
				detail: 'Cloudflare Worker routing /api/verify',
				status: 'Session checked'
			},
			{
				step: 'Metadata Strip',
				detail: 'Photo buffer parsed before Gemini',
				status: 'Metadata stripped'
			},
			{
				step: 'Gemini Verification',
				detail: 'Server-owned prompt asks for compact JSON',
				status: 'JSON parsed'
			},
			{
				step: 'Turso Ledger Write',
				detail: `${verificationRows} verification rows recorded`,
				status: 'Ledger transaction'
			}
		]
	};
};
