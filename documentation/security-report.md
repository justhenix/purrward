<!-- Submission note: security checks, fixes, and residual risk. -->

# Security Report

Production: https://purrward.app
Branch: `main`
Checked: 2026-07-08 04:20 +07:00

## Passed Locally

- Type/Svelte check: passed
- Unit tests: 145 passed, 1 skipped
- Dependency audit: passed, `bun audit` found no vulnerabilities
- Lint: passed
- Production build: passed
- Built Cloudflare output HEAD smoke test: passed locally
- Literal secret scan in client/build output: clean
- Cloudflare custom domains: `purrward.app` and `www.purrward.app` returned HTTP 200

## Security Controls Confirmed

- Session cookies are HttpOnly, SameSite=Strict, Secure in production.
- Photo uploads validate jpeg/png/webp and 5MB max.
- Image metadata is stripped before Gemini.
- Gemini proof prompt is server-owned.
- Points are server-owned and DB transaction-backed.
- API/auth rate limits are active.

## Dependency Fixes

- `enhanced-resolve` forced to `5.24.2` to clear the Aikido path traversal finding.
- `cookie` forced to `0.7.2` to clear the npm advisory surfaced by `bun audit`.
- `esbuild` forced to `0.28.1` to clear the dev-server advisory surfaced by `bun audit`.

## Aikido Status

See `documentation/aikido-test.md`.

![Aikido repository issue list](./aikido-repository-issues.png)

![Aikido AI Code Audit findings](./aikido-code-audit.png)

The repository issue list screenshot, AI Code Audit screenshot, and remediation table are tracked in `documentation/aikido-test.md`. Expected residuals after deploy retest are Cloudflare's managed `Server` header, the GitHub organization IP allow-list policy, and Aikido's low-severity inline CSS warning for current Svelte dynamic styles.
