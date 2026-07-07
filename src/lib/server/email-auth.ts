// SECURITY: email/password auth, password hashing, reset tokens, and auth rate limits.
import { eq } from 'drizzle-orm';
import {
	authRateLimits,
	emailCredentials,
	passwordResetTokens,
	sessions,
	users
} from './db/schema';
import { createSession, normalizeEmail } from './auth';

type Database = typeof import('./db').db;
type EmailCredential = typeof emailCredentials.$inferSelect;
type AuthScope = 'login' | 'register' | 'forgot' | 'reset';

const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_ITERATIONS = 210_000;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const AUTH_RATE_WINDOW_MS = 60 * 60 * 1000;
const AUTH_RATE_LIMIT = 5;
const DUMMY_SALT = 'LTXfR8B535MdxEsJgtA7qLw26xurWkWZVrcy8wZUsvk';

export type AuthRateResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function readEmail(formData: FormData): string | null {
	const value = formData.get('email');
	return typeof value === 'string' ? normalizeEmail(value) : null;
}

export function readPassword(formData: FormData, field = 'password'): string | null {
	const value = formData.get(field);
	if (typeof value !== 'string') return null;
	if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) return null;
	return value;
}

export function passwordHelpText(): string {
	return `Use ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters.`;
}

export async function consumeAuthAttempt(input: {
	database: Database;
	scope: AuthScope;
	clientAddress: string;
	now?: number;
	limit?: number;
	windowMs?: number;
}): Promise<AuthRateResult> {
	const now = input.now ?? Date.now();
	const keyHash = await hashString(input.clientAddress || 'unknown');
	const id = `${input.scope}:${keyHash}`;
	const limit = input.limit ?? AUTH_RATE_LIMIT;
	const windowMs = input.windowMs ?? AUTH_RATE_WINDOW_MS;

	const rows = await input.database
		.select()
		.from(authRateLimits)
		.where(eq(authRateLimits.id, id))
		.limit(1);
	const existing = rows[0];

	if (!existing) {
		await input.database.insert(authRateLimits).values({
			id,
			scope: input.scope,
			keyHash,
			attempts: 1,
			resetAt: now + windowMs,
			updatedAt: now
		});
		return { allowed: true };
	}

	if (existing.resetAt <= now) {
		await input.database
			.update(authRateLimits)
			.set({ attempts: 1, resetAt: now + windowMs, updatedAt: now })
			.where(eq(authRateLimits.id, id));
		return { allowed: true };
	}

	if (existing.attempts >= limit) {
		return {
			allowed: false,
			retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
		};
	}

	await input.database
		.update(authRateLimits)
		.set({ attempts: existing.attempts + 1, updatedAt: now })
		.where(eq(authRateLimits.id, id));
	return { allowed: true };
}

export async function registerEmailUser(input: {
	database: Database;
	email: string;
	password: string;
	now?: number;
}): Promise<{ sessionId: string } | null> {
	const existing = await input.database
		.select()
		.from(users)
		.where(eq(users.email, input.email))
		.limit(1);
	if (existing[0]) return null;

	const now = input.now ?? Date.now();
	const userId = crypto.randomUUID();
	const credential = await hashPassword(input.password);

	try {
		await input.database.insert(users).values({
			id: userId,
			googleSub: null,
			email: input.email,
			displayName: 'Cat Parent',
			avatarUrl: null,
			createdAt: now
		});
		await input.database.insert(emailCredentials).values({
			userId,
			...credential,
			createdAt: now,
			updatedAt: now
		});
	} catch (error) {
		// SECURITY/observability: a swallowed insert here previously masked a schema
		// drift (users.google_sub NOT NULL) as a generic "email taken" failure.
		console.error('registerEmailUser: insert failed', error);
		await input.database.delete(users).where(eq(users.id, userId));
		return null;
	}

	const sessionId = await createSession({
		database: input.database,
		userId,
		googleSub: null,
		email: input.email,
		displayName: 'Cat Parent',
		avatarUrl: null,
		authMethod: 'email',
		now
	});

	return { sessionId };
}

export async function signInWithEmail(input: {
	database: Database;
	email: string;
	password: string;
	now?: number;
}): Promise<{ sessionId: string } | null> {
	const userRows = await input.database
		.select()
		.from(users)
		.where(eq(users.email, input.email))
		.limit(1);
	const user = userRows[0];

	if (!user) {
		await runDummyPasswordCheck(input.password);
		return null;
	}

	const credentialRows = await input.database
		.select()
		.from(emailCredentials)
		.where(eq(emailCredentials.userId, user.id))
		.limit(1);
	const credential = credentialRows[0];

	if (!credential || !(await verifyPassword(input.password, credential))) {
		if (!credential) await runDummyPasswordCheck(input.password);
		return null;
	}

	const sessionId = await createSession({
		database: input.database,
		userId: user.id,
		googleSub: user.googleSub,
		email: user.email,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
		authMethod: 'email',
		now: input.now
	});

	return { sessionId };
}

export async function requestPasswordReset(input: {
	database: Database;
	email: string;
	now?: number;
}): Promise<{ token: string } | null> {
	const now = input.now ?? Date.now();
	const userRows = await input.database
		.select()
		.from(users)
		.where(eq(users.email, input.email))
		.limit(1);
	const user = userRows[0];
	if (!user) return null;

	const credentialRows = await input.database
		.select({ userId: emailCredentials.userId })
		.from(emailCredentials)
		.where(eq(emailCredentials.userId, user.id))
		.limit(1);
	if (!credentialRows[0]) return null;

	const token = generateResetToken();
	const tokenHash = await hashString(token);
	await input.database.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
	await input.database.insert(passwordResetTokens).values({
		tokenHash,
		userId: user.id,
		email: user.email,
		createdAt: now,
		expiresAt: now + RESET_TOKEN_TTL_MS,
		usedAt: null
	});

	return { token };
}

export async function resetPasswordWithToken(input: {
	database: Database;
	token: string;
	password: string;
	now?: number;
}): Promise<{ sessionId: string } | null> {
	if (!/^[A-Za-z0-9_-]{32,128}$/.test(input.token)) return null;

	const now = input.now ?? Date.now();
	const tokenHash = await hashString(input.token);
	const tokenRows = await input.database
		.select()
		.from(passwordResetTokens)
		.where(eq(passwordResetTokens.tokenHash, tokenHash))
		.limit(1);
	const resetToken = tokenRows[0];
	if (!resetToken || resetToken.usedAt !== null || resetToken.expiresAt <= now) return null;

	const userRows = await input.database
		.select()
		.from(users)
		.where(eq(users.id, resetToken.userId))
		.limit(1);
	const user = userRows[0];
	if (!user) return null;

	const credential = await hashPassword(input.password);
	await input.database
		.update(emailCredentials)
		.set({ ...credential, updatedAt: now })
		.where(eq(emailCredentials.userId, resetToken.userId));
	await input.database
		.update(passwordResetTokens)
		.set({ usedAt: now })
		.where(eq(passwordResetTokens.userId, resetToken.userId));
	await input.database.delete(sessions).where(eq(sessions.userId, resetToken.userId));

	const sessionId = await createSession({
		database: input.database,
		userId: user.id,
		googleSub: user.googleSub,
		email: user.email,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
		authMethod: 'email',
		now
	});

	return { sessionId };
}

export function createPasswordResetUrl(origin: string, token: string): string {
	return new URL(`/auth/reset/${token}`, origin).toString();
}

export function canShowDevResetLink(url: URL, enabled: string | undefined): boolean {
	const host = url.hostname.toLowerCase();
	return enabled === 'true' && (host === 'localhost' || host === '127.0.0.1');
}

async function hashPassword(password: string): Promise<{
	passwordHash: string;
	passwordSalt: string;
	iterations: number;
}> {
	const salt = new Uint8Array(32);
	crypto.getRandomValues(salt);
	return {
		passwordHash: await derivePasswordHash(password, salt, PASSWORD_ITERATIONS),
		passwordSalt: bytesToBase64Url(salt),
		iterations: PASSWORD_ITERATIONS
	};
}

async function verifyPassword(password: string, credential: EmailCredential): Promise<boolean> {
	const salt = base64UrlToBytes(credential.passwordSalt);
	const hash = await derivePasswordHash(password, salt, credential.iterations);
	return constantTimeEqual(hash, credential.passwordHash);
}

async function runDummyPasswordCheck(password: string): Promise<void> {
	await derivePasswordHash(password, base64UrlToBytes(DUMMY_SALT), PASSWORD_ITERATIONS);
}

async function derivePasswordHash(
	password: string,
	salt: Uint8Array,
	iterations: number
): Promise<string> {
	const material = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: toArrayBuffer(salt), iterations },
		material,
		256
	);
	return bytesToBase64Url(new Uint8Array(bits));
}

function generateResetToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return bytesToBase64Url(bytes);
}

async function hashString(value: string): Promise<string> {
	const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return bytesToBase64Url(new Uint8Array(bytes));
}

function constantTimeEqual(left: string, right: string): boolean {
	const leftBytes = new TextEncoder().encode(left);
	const rightBytes = new TextEncoder().encode(right);
	const maxLength = Math.max(leftBytes.length, rightBytes.length);
	let diff = leftBytes.length ^ rightBytes.length;
	for (let index = 0; index < maxLength; index += 1) {
		diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
	}
	return diff === 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
	const padded = value
		.replace(/-/g, '+')
		.replace(/_/g, '/')
		.padEnd(Math.ceil(value.length / 4) * 4, '=');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	const buffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(buffer).set(bytes);
	return buffer;
}
