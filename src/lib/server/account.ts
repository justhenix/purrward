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
