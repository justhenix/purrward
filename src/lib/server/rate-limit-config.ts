// SECURITY: server-owned rate-limit constants and env override parsing.
export const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_COUPON_TRADE_DAILY_LIMIT = 1;
export const DEFAULT_VET_DAILY_LIMIT = 10;

export function parsePositiveInt(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
