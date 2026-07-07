// Coverage for disposable-email domain canonicalization.
import { describe, expect, it } from 'vitest';
import { isDisposableEmailDomain } from './email-domains';

describe('email domain policy', () => {
	it('blocks disposable domains even with case, subdomains, or trailing dots', () => {
		expect(isDisposableEmailDomain('cat@mailinator.com')).toBe(true);
		expect(isDisposableEmailDomain('cat@Inbox.Mailinator.Com')).toBe(true);
		expect(isDisposableEmailDomain('cat@mailinator.com.')).toBe(true);
		expect(isDisposableEmailDomain('cat@example.com')).toBe(false);
	});
});
