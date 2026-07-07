<!-- Submission note: Aikido scan evidence and unresolved external items. -->

# Aikido Test

Status: in progress on Aikido, with local fixes applied and deployed retest pending.

Repository: https://github.com/justhenix/purrward
Branch scanned: `main`
Production URL: https://purrward.app
Checked: 2026-07-08 03:50 +07:00

## Evidence

- AI Code Audit: `f19f3e51-b6c4-8958-b096-3c95de7efd60`
- AI Code Audit state: running in Aikido dashboard.
- Domain scan: manually restarted for `https://purrward.app`.
- Domain scan result improved from 4 web issues to 2 web issues.
- Local dependency audit after fixes: `bun audit` found no vulnerabilities.

## Aikido Findings Seen

| Finding                                       | Action                                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CSP header not set                            | Resolved by Aikido retest.                                                                                                  |
| Missing anti-clickjacking header              | Resolved by Aikido retest.                                                                                                  |
| HSTS header missing                           | HEAD response returned 500 before this fix; built output now returns HEAD 200 with security headers. Needs deployed retest. |
| CSP config allows inline CSS                  | Low severity; kept for current Svelte dynamic style attributes to avoid breaking the demo UI.                               |
| Server leaks version info via `Server` header | Cloudflare-managed header; documented as platform residual if Aikido keeps it open.                                         |
| `enhanced-resolve` path traversal             | Fixed by package override to `enhanced-resolve@5.24.2`.                                                                     |
| GitHub organization IP allow list             | GitHub org policy item; documented as account-level residual if Aikido keeps it open.                                       |

Do not mark the Aikido dashboard as fully passed until the running scans complete there.
