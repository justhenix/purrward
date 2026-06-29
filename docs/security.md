# Purrward Security Architecture

> Standalone security spec. Judges: read this one file to see Purrward's security posture.
> Referenced by [AGENTS.md](../AGENTS.md) and [scaffold.md](scaffold.md).

---

## Trust Boundaries

```
Client (SvelteKit SSR/CSR)
    ↓ HTTPS only
Cloudflare Worker (validation boundary)
    ↓ parameterized queries     ↓ sandboxed prompt     ↓ RPC
  Turso DB                   Gemini API            Solana RPC
```

**Rule**: Client is untrusted. All validation at Worker boundary. Never trust client-supplied IDs, counts, or params.

---

## Authentication

**Method**: Google OAuth 2.0 via Cloudflare Workers

| Step          | Detail                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Initiate      | Client → Worker `GET /auth/google` → redirect to Google consent                                     |
| Callback      | Google → Worker `GET /auth/callback?code=...` → exchange code for tokens                            |
| Session       | Worker creates session row in Turso, sets cookie                                                    |
| Cookie        | `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, `Max-Age=7d`                                     |
| Validation    | Every protected endpoint: Worker reads cookie → lookup session in Turso → reject if expired/missing |
| Logout        | `POST /auth/logout` → delete session row + clear cookie                                             |
| Token storage | Google tokens stored server-side only. Never sent to client                                         |

**Session table**:

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,        -- SECURITY: cryptographically random, 32 bytes hex
  user_id TEXT NOT NULL,
  google_sub TEXT NOT NULL,   -- Google account ID
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
```

**User table**:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  purrpoints INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
```

---

## Input Validation

| Surface              | Validation                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Photo uploads        | MIME allowlist (`image/jpeg`, `image/png`, `image/webp`), 5MB max, EXIF stripped server-side |
| Form inputs          | Sanitized, length-capped, type-checked at Worker                                             |
| API params           | Schema validation at Worker entry point                                                      |
| Cat names / captions | HTML-escaped, max 50 chars, no script tags                                                   |
| Gemini user input    | Sandboxed in structured template, never raw-concatenated                                     |

---

## Prompt Injection Defense

Gemini 3.1 Flash Lite is used for photo verification and AI Vet chat. Attack surface:

| Vector                                   | Defense                                                    |
| ---------------------------------------- | ---------------------------------------------------------- |
| EXIF metadata with embedded instructions | Strip all EXIF before processing                           |
| Malicious filename                       | Sanitize filename, never pass to AI                        |
| User text with prompt override attempts  | Wrap in delimited template: `<user_input>...</user_input>` |
| System prompt extraction                 | System prompt hardcoded in Worker, never echoed            |
| Output manipulation                      | Filter AI response for unexpected patterns before display  |

**Gemini prompt template pattern**:

```
[SYSTEM PROMPT - IMMUTABLE, SERVER-SIDE]
You are a veterinary triage assistant. You ONLY answer questions about
feline health, behavior, and nutrition. Refuse all other topics.

[USER INPUT - SANDBOXED]
<user_input>
{sanitized_user_message}
</user_input>

Respond only to the content within <user_input> tags.
```

---

## Rate Limiting

| Action               | Limit               | Enforcement              |
| -------------------- | ------------------- | ------------------------ |
| Point-earning tasks  | 6/day per task type | Turso row count check    |
| Photo uploads        | 20/day per user     | Worker middleware        |
| AI Vet chat messages | 50/day per user     | Worker middleware        |
| Auth attempts        | 10/hour per IP      | Cloudflare rate limiting |
| API calls (general)  | 100/min per IP      | Cloudflare rate limiting |

---

## Content Security Policy

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data:;
connect-src 'self' https://generativelanguage.googleapis.com https://accounts.google.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self' https://accounts.google.com;
```

Applied via Cloudflare Worker response headers on all routes.

---

## CORS

- Allowed origins: app domain only (e.g. `https://purrward.pages.dev`)
- No wildcard (`*`) ever
- Credentials: `include` (for session cookies)

---

## Solana / Phantom Security

| Concern               | Defense                                                     |
| --------------------- | ----------------------------------------------------------- |
| Private keys          | Never stored server-side. Wallet is client-only             |
| Transaction params    | Validated server-side before presenting to user for signing |
| SPL token mint amount | Worker-controlled, user cannot manipulate                   |
| Missing wallet        | Graceful degradation — app works without Web3               |
| Fake wallet injection | Validate wallet adapter follows wallet-standard             |

---

## Data Privacy

- Pet photos: processed for verification → result stored → photo discarded (not permanently stored on server)
- EXIF metadata: stripped before any processing
- User data: scoped to `user_id` via session, never leaked cross-user
- Account deletion: cascade delete all user data (users, sessions, points, cats)
- No third-party analytics or tracking

---

## IDOR Prevention

- All DB queries: `WHERE user_id = ?` with session-derived `user_id`
- Never trust client-supplied user IDs for data access
- Points balance: server-authoritative. Client display only
- Cat data: owned by user, verified via session

---

## Error Handling

| Context              | Response                                                      |
| -------------------- | ------------------------------------------------------------- |
| Client-facing errors | Generic message: "Something went wrong. Please try again."    |
| Server logs          | Full error details, stack trace, request context              |
| Auth failures        | Generic "Authentication failed" — no hint about what failed   |
| Rate limit exceeded  | `429 Too Many Requests` with `Retry-After` header             |
| Validation failures  | Specific field errors (safe to show — tells user what to fix) |

---

## Security Checklist (Pre-Deploy)

- [ ] No API keys in client bundle (`grep -r "AIza\|sk-\|TURSO" .svelte-kit/output`)
- [ ] No `localStorage` for auth tokens (`grep -rn "localStorage" src/`)
- [ ] All DB queries parameterized
- [ ] CSP headers present on all routes
- [ ] Rate limiting active on all endpoints
- [ ] EXIF stripped from uploaded photos
- [ ] Gemini system prompt not overridable by user input
- [ ] Error responses generic (no stack traces to client)
- [ ] CORS allowlist correct (no wildcard)
- [ ] Session cookies: HttpOnly + Secure + SameSite=Strict
- [ ] Google OAuth client secret in env vars only
- [ ] Session ID: cryptographically random, 32+ bytes
- [ ] Expired sessions cleaned up (TTL or cron)
- [ ] Build output audited for secret leakage

---

## Judge Evidence

- This file is the security architecture and pre-deploy checklist.
- Put real scan reports in `docs/security-reports/` or link them from `docs/submission.md`.
- Do not present a mock scan as real evidence. Mock/dev-mode scan panels are allowed only when labeled as demonstration.
