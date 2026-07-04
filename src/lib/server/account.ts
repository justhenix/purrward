// SECURITY: authenticated account deletion with a scoped cascade over all user-owned data.
import { eq } from 'drizzle-orm';
import {
	cats,
	emailCredentials,
	habitCompletions,
	passwordResetTokens,
	rateLimits,
	sessions,
	users
} from './db/schema';
import { hashRateKey } from './rate-limit';

type Database = typeof import('./db').db;

export const PARENT_NAME_MAX = 40;

// Updates the account display (parent) name. Returns null when the name is invalid.
export async function updateParentName(
	database: Database,
	userId: string,
	value: unknown
): Promise<string | null> {
	if (typeof value !== 'string') return null;
	const name = value.trim();
	if (name.length < 1 || name.length > PARENT_NAME_MAX) return null;
	await database.update(users).set({ displayName: name }).where(eq(users.id, userId));
	return name;
}

// Deletes every row scoped to userId. Order respects FKs (children before parents).
export async function deleteAccount(database: Database, userId: string): Promise<void> {
	const vetLimitId = `vet_triage:${await hashRateKey(userId)}`;

	await database.transaction(async (tx) => {
		// Clear the self-referential active cat pointer before removing cats.
		await tx.update(users).set({ activeCatId: null }).where(eq(users.id, userId));
		await tx.delete(habitCompletions).where(eq(habitCompletions.userId, userId));
		await tx.delete(cats).where(eq(cats.userId, userId));
		await tx.delete(sessions).where(eq(sessions.userId, userId));
		await tx.delete(emailCredentials).where(eq(emailCredentials.userId, userId));
		await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
		await tx.delete(rateLimits).where(eq(rateLimits.id, vetLimitId));
		await tx.delete(users).where(eq(users.id, userId));
	});
}
