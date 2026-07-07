<!-- Security pre-deploy checklist for Purrward demo release. -->

# Security Pre-Deploy Checklist

Run this before public demo deployment. Keep unchecked items visible in release notes if live env access is unavailable.

- [ ] No API keys in client bundle output
- [ ] No auth tokens stored in `localStorage`
- [ ] DB access uses Drizzle/query builders, not string interpolation
- [ ] Protected APIs use the session user, not client-supplied user IDs
- [ ] Points, reward costs, reward codes, and cat ownership stay server-owned
- [ ] CSP headers are configured
- [ ] Rate limits are active on auth, upload, verify, vet, purchase, and redeem paths
- [ ] Uploads enforce jpeg/png/webp, 5MB max, and metadata stripping
- [ ] Gemini prompts are server-owned and user input is sandboxed
- [ ] Client-facing errors do not expose secrets or stack traces
- [ ] CORS allowlist is production-specific
- [ ] Session cookies are HttpOnly, Secure in production, and SameSite=Strict
- [ ] OAuth client secret, Turso credentials, and Gemini key are env-only
- [ ] Expired sessions are rejected and cleaned up
- [ ] Live OAuth/Turso/Gemini smoke tests are marked manual, not automated unless actually run
