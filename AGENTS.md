# Purrward Agent Rules

## Mode

- Use `/caveman ultra`: terse, abbreviated, arrows for causality.
- Use `/ponytail` full: simplest correct solution, YAGNI, stdlib/native first.
- Both persist all session. Off only: "stop caveman" / "stop ponytail".

## Project

- App: Purrward, a care-to-earn cat wellness PWA for #hackthekitty 2026.
- Stack: SvelteKit 5 runes, Bun, TailwindCSS v4, Turso/LibSQL, Drizzle, Cloudflare Workers, Gemini, Google OAuth.
- MVP first: Google OAuth sessions, habit/photo verification, points ledger, basic rewards, AI vet triage.
- Do not build Good-to-Have items from `docs/steps.md` unless explicitly requested.

## Source Docs

- Use live repo paths first; use `docs/scaffold.md` only for orientation when current.
- Security source: `docs/security.md`.
- Design source: `docs/design.md`.
- Roadmap source: `docs/steps.md`.
- Assets source: `docs/assets.md`.
- Commit style: `docs/commit.md`.

## Svelte / Styling

- Svelte 5 runes only: `$state`, `$derived`, `$effect`, `$props`, `$bindable`.
- No legacy `$:`, stores for local UI state, `createEventDispatcher`, or `on:` handlers.
- TypeScript strict. No `any`.
- Global styles live in the stylesheet imported by `src/routes/+layout.svelte` (`src/routes/layout.css` today).
- Use Tailwind v4 syntax already present in the repo; verify docs/skill guidance if unsure.
- Every new file gets a 1-line comment header explaining purpose.

## Security

- Validate and sanitize all input at the Worker/server boundary.
- API keys and OAuth secrets stay server-side only.
- DB queries use Drizzle/query builders, not string interpolation.
- Auth uses HttpOnly/Secure/SameSite=Strict session cookies.
- Points are server-owned; never trust client-supplied user IDs or point values.
- Photo uploads: jpeg/png/webp only, 5MB cap, strip metadata before Gemini.
- Gemini prompts are server-owned; user/photo metadata is never raw-concatenated.
- Rate-limit protected endpoints.
- Mark security-critical code with `// SECURITY:` comments.

## UI

- Use available UI/design skills when present; otherwise follow `docs/design.md`.
- Cozy feline wellness aesthetic: soft warm colors, readable typography, tactile card UI.
- No monospace in user-facing UI, no neon/cyber dashboard, no generic AI/SaaS copy.
- Missing final image assets use wireframe placeholders, not fake realistic assets.

## Verification

- Run relevant checks before handoff: `bun run check`, `bun test`, `bun run lint`.
- Run `docs/security.md` checklist before deploy.
