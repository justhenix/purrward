# Purrward

Purrward is a care-to-earn cat wellness PWA for #hackthekitty 2026. It rewards cat owners for consistent routines like feeding, water, litter care, play, grooming, and medication.

## Demo Flow

Core product loop:

```text
pick a cat -> care task -> photo proof -> server validation -> metadata strip -> Gemini verification -> daily anti-cheat caps -> per-cat + user points ledger -> rewards
```

The home screen wires this flow through the secure `/api/verify` endpoint. Sign in, onboard a cat (or join free cat mode for community cats), log a routine with photo proof, and watch Purrpoints grow. Live OAuth, Turso, and Gemini credentials still need a final smoke test before recording the demo — see `docs/smoke-test-checklist.md`.

## What's Implemented

- Google OAuth + HttpOnly session management.
- Multi-cat support + free (community) cat mode: `/onboarding`, `/cats`, server-owned active cat.
- Habit tracker with live camera / upload photo proof, scoped to the active cat.
- Gemini photo verification (JSON, server-owned prompt) with per-cat + per-user points.
- AI vet triage: authenticated, sandboxed prompt, 50/day cap, auto emergency banner.
- Points system + rewards backed by Turso/LibSQL via Drizzle.
- Cat avatar with dynamic mood states (happy / hungry / sleeping) and a customizer in `/cats`.
- App-level rate limiting (IP + user), WebP upload support with metadata stripping.
- Account deletion with cascade delete and typed confirmation.
- Installable PWA (manifest, icons, service worker app-shell caching).

## Requires Live Env Vars

Auth, verification, vet triage, and the database need real credentials. The app runs and
builds without them, but those flows are inert until configured. See
`docs/smoke-test-checklist.md` for the full variable list and smoke tests. These were
**not run** in the build environment (no live credentials) and are not claimed as passing.

## Why It Fits

Purrward makes the cat theme functional, not decorative: the app rewards real feline care, rejects unrelated or low-confidence proof, and keeps rewards tied to a server-side wellness ledger.

## Stack

- SvelteKit 5 + TypeScript + Bun
- TailwindCSS v4
- Cloudflare Pages/Workers
- Turso/LibSQL + Drizzle ORM
- Google OAuth + HttpOnly sessions
- Gemini REST API for photo verification and AI vet triage
- Installable PWA (manifest + service worker)

## Prerequisites

- Bun 1.2+
- Node.js 22+ / npm 11+ for Wrangler and Playwright tooling
- Cloudflare account with Wrangler login for deploys
- Turso/LibSQL database credentials
- Google OAuth client for sign-in
- Gemini API key for photo verification and vet triage

## Configuration

Copy `.env.example` to `.env`, then fill the live values:

```powershell
Copy-Item .env.example .env
```

Required for the full demo:

| Variable               | Purpose                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`         | Turso/LibSQL connection URL                                        |
| `DATABASE_AUTH_TOKEN`  | Turso auth token                                                   |
| `GOOGLE_CLIENT_ID`     | Google OAuth app client ID                                         |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app client secret                                     |
| `GOOGLE_REDIRECT_URI`  | OAuth callback, e.g. `http://localhost:5173/auth/callback` locally |
| `GEMINI_API_KEY`       | Gemini API key for proof and vet checks                            |
| `GEMINI_MODEL`         | Photo verification model                                           |
| `GEMINI_VET_MODEL`     | Vet triage model                                                   |

For production, set the same values as Cloudflare Pages environment variables or secrets. Keep `.env` local only.

## Security Highlights

- Google OAuth callback exchanges tokens server-side only.
- Session cookie is HttpOnly, SameSite=Strict, and Secure in production.
- Protected endpoints use `event.locals.user`; client user and cat IDs are ignored.
- Photo uploads enforce jpeg/png/webp and 5MB max, with EXIF/XMP stripped before Gemini.
- Gemini prompts are server-owned; vet input is sandboxed in `<user_input>` tags.
- Rate limiting: 100/min per IP, 10/hour auth per IP, 50/day vet per user, 20/day uploads, 6/day per cat task. All 429s include `Retry-After`.
- Points are server-computed and awarded in an atomic DB transaction (user + cat).
- Account deletion cascades all user-owned data.

Full checklists: `docs/security-checklist.md`, `docs/submission-checklist.md`, `docs/smoke-test-checklist.md`.

## Quickstart

```powershell
bun install
bun run dev
```

Open `http://localhost:5173`. Fill `.env` before testing auth, photo verification, rewards, or vet triage.

## Run Instructions

```powershell
# local dev
bun run dev

# type + Svelte checks
bun run check

# unit tests
bun test

# lint/format check
bun run lint

# production build
bun run build
```

## Deploy

Build output is `.svelte-kit/cloudflare`, configured for Cloudflare Pages:

```powershell
bun run build
npx wrangler pages deploy .svelte-kit\cloudflare --project-name hackkitty --branch main
```

## Checks

```powershell
bun run check
bun test
bun run lint
```

## Docs

All project knowledge lives in `.kiro/`:

- [Product & Stack](.kiro/steering/product.md)
- [Code Style & Commits](.kiro/steering/code-style.md)
- [Security](.kiro/steering/security.md)
- [Design System](.kiro/steering/design.md)
- [Repo Structure](.kiro/steering/structure.md)
- [Assets](.kiro/steering/assets.md)
- [Demo & Submission](.kiro/steering/demo.md)
- [MVP Spec](.kiro/specs/core-platform/)
