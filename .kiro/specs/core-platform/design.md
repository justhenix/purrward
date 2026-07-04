# Purrward — Core Platform Design

## Architecture

```
Client (SvelteKit SSR/CSR)
    ↓ HTTPS only
Cloudflare Worker (validation boundary)
    ↓ parameterized queries     ↓ sandboxed prompt     ↓ RPC
  Turso DB                   Gemini API            Solana RPC
```

Client is untrusted. All validation at Worker boundary.

## Auth Flow

1. `GET /auth/google` → redirect to Google consent
2. `GET /auth/callback?code=...` → exchange code for tokens server-side
3. Create/update user row + session row in Turso
4. Set cookie: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, `Max-Age=7d`
5. Protected routes: read cookie → lookup session → reject if expired/missing
6. `POST /auth/logout` → delete session row + clear cookie

## Verification Pipeline

```
habit → photo upload → server validation (MIME/size) → EXIF strip → Gemini verify → anti-cheat cap → points ledger → rewards
```

## Data Model

### users

`id` TEXT PK, `google_sub` TEXT UNIQUE, `email` TEXT, `display_name` TEXT, `avatar_url` TEXT, `purrpoints` INTEGER DEFAULT 0, `created_at` INTEGER.

### sessions

`id` TEXT PK (32 bytes hex random), `user_id` TEXT FK, `google_sub` TEXT, `email` TEXT, `display_name` TEXT, `avatar_url` TEXT, `created_at` INTEGER, `expires_at` INTEGER.

## Key Technical Decisions

- Drizzle ORM for type-safe parameterized queries → no SQL injection
- Gemini prompts immutable server-side with `<user_input>` sandboxing → no prompt injection
- Points server-authoritative → no client-side manipulation
- EXIF stripped before processing → no metadata-based prompt injection
- Rate limits enforced at Worker middleware level
