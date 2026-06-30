---
inclusion: always
name: code-style
description: Svelte 5 runes, TypeScript strict, Tailwind v4, and commit conventions for Purrward.
---

# Code Style

## Svelte

- Svelte 5 runes only: `$state`, `$derived`, `$effect`, `$props`, `$bindable`.
- Banned: legacy `$:`, stores for local UI state, `createEventDispatcher`, `on:` handlers.
- TypeScript strict. No `any`.
- Every new file gets a 1-line comment header explaining purpose.

## Styling

- TailwindCSS v4 syntax already in repo.
- Global styles live in `src/routes/layout.css` (imported by `src/routes/+layout.svelte`).
- Use `layout.css` tokens for colors. No custom hardcoded color values.
- Fonts: Quicksand (display headings), Inter (body/UI). Never use monospace.

## Commits

Format: `type(scope): short summary`

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Rules:
- Lowercase type
- Scope optional but encouraged
- Imperative mood summary, ≤50 chars, no trailing period
- Body optional — add when change is not obvious
- Breaking changes: mark with `!` or `BREAKING CHANGE:` footer
- One commit, one purpose
- No AI agent co-author lines

## Verification

Run before handoff:
- `bun run check`
- `bun test`
- `bun run lint`
