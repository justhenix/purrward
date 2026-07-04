// SECURITY: server-side disposable/throwaway email blocklist for signup gating.
// Policy: accept any real provider (gmail, proton.me, outlook, custom domains, etc.).
// Only decline known disposable/temporary/fake inbox providers.

// Curated set of disposable/temporary inbox domains. Matched exactly or as a
// parent of a subdomain (e.g. "foo.mailinator.com" -> "mailinator.com").
const DISPOSABLE_DOMAINS = new Set<string>([
	'0clock.net',
	'0wnd.net',
	'10minutemail.com',
	'10minutemail.net',
	'20minutemail.com',
	'33mail.com',
	'anonbox.net',
	'burnermail.io',
	'dispostable.com',
	'disposablemail.com',
	'discard.email',
	'dropmail.me',
	'emailondeck.com',
	'fakeinbox.com',
	'fakemail.net',
	'fakemailgenerator.com',
	'getairmail.com',
	'getnada.com',
	'guerrillamail.biz',
	'guerrillamail.com',
	'guerrillamail.de',
	'guerrillamail.info',
	'guerrillamail.net',
	'guerrillamail.org',
	'guerrillamailblock.com',
	'inboxbear.com',
	'inboxkitten.com',
	'jetable.org',
	'mailcatch.com',
	'maildrop.cc',
	'maileater.com',
	'mailinator.com',
	'mailinator.net',
	'mailnesia.com',
	'mailsac.com',
	'mailtemp.net',
	'mintemail.com',
	'moakt.com',
	'mohmal.com',
	'mytemp.email',
	'nada.email',
	'nowmymail.com',
	'sharklasers.com',
	'spam4.me',
	'spamgourmet.com',
	'temp-mail.io',
	'temp-mail.org',
	'tempinbox.com',
	'tempmail.com',
	'tempmail.dev',
	'tempmail.plus',
	'tempmailo.com',
	'tempr.email',
	'throwawaymail.com',
	'trashmail.com',
	'trashmail.de',
	'trashmail.net',
	'wegwerfmail.de',
	'yopmail.com',
	'yopmail.fr',
	'yopmail.net'
]);

// Returns true when the email's domain is a known disposable/throwaway provider.
// Expects a normalized (lowercased, validated) email address.
export function isDisposableEmailDomain(email: string): boolean {
	const domain = email.split('@')[1];
	if (!domain) return false;
	if (DISPOSABLE_DOMAINS.has(domain)) return true;
	// Catch subdomains of a blocked provider (e.g. inbox.mailinator.com).
	for (const blocked of DISPOSABLE_DOMAINS) {
		if (domain.endsWith(`.${blocked}`)) return true;
	}
	return false;
}
