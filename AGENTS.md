# Purrward Agent Rules

Entry point for all coding agents (Kiro, Codex, Antigravity, Claude Code).
Full project knowledge lives in `.kiro/steering/` and `.kiro/specs/` — read those for depth.
This file is the index plus the rules that must never be skipped.

## Mode (persistent all session)

- `/caveman ultra` — terse, abbreviated, arrows for causality. Rules: `.kiro/steering/caveman.md`.
- `/ponytail full` — simplest correct solution, YAGNI, stdlib/native first. Rules: `.kiro/steering/ponytail.md`.
- Off only on explicit "stop caveman" / "stop ponytail".
- Auto-suspend caveman for security warnings, irreversible-action confirmations, and multi-step sequences.

## Project

Purrward — care-to-earn cat wellness PWA for #hackthekitty 2026.
Stack: SvelteKit 5 (runes), Bun, TailwindCSS v4, Turso/LibSQL + Drizzle, Cloudflare Workers, Gemini, Google OAuth.
MVP first. Do not build Good-to-Have items unless explicitly asked. Scope: `.kiro/steering/product.md`.

## Source of Truth

| Topic                 | File                          | When to read              |
| --------------------- | ----------------------------- | ------------------------- |
| Product / stack / scope | `.kiro/steering/product.md`   | always                    |
| Code style / commits  | `.kiro/steering/code-style.md`| always                    |
| Security (full spec)  | `.kiro/steering/security.md`  | auth, API, uploads, DB, AI|
| Design system         | `.kiro/steering/design.md`    | any UI / visual work      |
| Repo structure        | `.kiro/steering/structure.md` | navigating `src/**`       |
| Assets                | `.kiro/steering/assets.md`    | avatar / art work         |
| Demo / submission     | `.kiro/steering/demo.md`      | demo prep, final submit   |
| MVP spec              | `.kiro/specs/core-platform/`  | implementing MVP features |

## Non-Negotiables

These are enforced even at a glance; see the files above for the full rules.

- Svelte 5 runes only (`$state`, `$derived`, `$effect`, `$props`, `$bindable`). No legacy `$:`, UI-state stores, `createEventDispatcher`, or `on:` handlers. TypeScript strict, no `any`.
- Every new file gets a 1-line comment header explaining its purpose.
- Validate/sanitize all input at the Worker boundary. Never trust client-supplied IDs or point values; points are server-owned.
- API keys and OAuth secrets stay server-side only. DB via Drizzle/query builders, never string interpolation.
- Sessions: HttpOnly + Secure + SameSite=Strict cookies. Photo uploads: jpeg/png/webp, ≤5MB, EXIF stripped before Gemini. Gemini prompts server-owned, user input sandboxed in a template.
- Mark security-critical code with `// SECURITY:` comments. Rate-limit protected endpoints.
- No monospace in UI, no neon/cyber dashboard, no generic AI/SaaS copy. Missing art → wireframe placeholders, not fake assets.

## Verification

Before handoff: `bun run check`, `bun test`, `bun run lint`.
Before deploy: complete the pre-deploy checklist in `.kiro/steering/security.md`.
