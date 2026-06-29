# Purrward Agent Rules

## Mode

- Use `/caveman ultra` — terse, abbreviated, arrows → causality
- Use `/ponytail` full — laziest correct solution, YAGNI, stdlib first
- Both persist all session. Off only: "stop caveman" / "stop ponytail"

## Project Context

- **App**: Purrward — care-to-earn cat wellness PWA
- **Stack**: SvelteKit 5 (runes) + Bun + TailwindCSS + Turso (LibSQL) + Cloudflare Workers + Gemini 3.1 Flash Lite + Phantom (Solana)
- **Hackathon**: #hackthekitty 2026
- **Judging weights** (always keep in mind):

| Category | Weight |
|----------|--------|
| Technical Execution | 25% |
| Innovation & Creativity | 20% |
| Security | 15% |
| Theme Relevance | 15% |
| UX / UI | 15% |
| Documentation | 10% |

## Anti-Hallucination

- Never invent APIs, packages, or Svelte 5 syntax. Unsure → read docs/SKILL.md first
- Reference actual file paths from [scaffold.md](docs/scaffold.md). Never guess routes
- "Good-to-Have" in [steps.md](docs/steps.md) → don't build unless explicitly asked
- Use `/systematic-debugging` skill before proposing bug fixes
- Don't generate placeholder data that looks real (fake vet names, fake clinic addresses)
- When using Svelte 5: `$state`, `$derived`, `$effect`, `$props`, `$bindable` — no legacy `$:`, no stores, no `createEventDispatcher`
- When using TailwindCSS: read skill docs for correct version syntax

## Security (Aikido-Grade)

Full spec → [security.md](docs/security.md). Summary:

- All input: validate + sanitize at Cloudflare Worker boundary
- File uploads: MIME allowlist (jpeg/png/webp), 5MB cap, strip EXIF
- API keys: NEVER client-side. Worker env vars only
- Rate limit: per-user, per-endpoint, at edge
- Gemini prompts: system prompt server-side, user input never raw-concatenated
- DB: parameterized queries only. Zero string interpolation
- Auth: Google OAuth → HttpOnly/Secure/SameSite=Strict session cookie
- CSP + CORS: strict, allowlist-only
- Solana: validate tx params server-side, wallet client-side only
- Tag security code with `// SECURITY:` comments
- Run [security.md](docs/security.md) checklist before deploy

## Code Style

- `app.css` for color scheme — no custom hardcoded CSS
- Svelte 5 runes only — no legacy patterns
- TypeScript strict, no `any`
- Small focused components, one concern per file
- Follow [scaffold.md](docs/scaffold.md) file structure exactly
- Mark simplifications: `// simplify:` comments
- Mark security-critical code: `// SECURITY:` comments
- Every new file: 1-line comment header explaining purpose
