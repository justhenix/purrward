# Purrward — Core Platform Tasks

## Phase 0: Setup (Done)
- [x] Initialize SvelteKit + Bun
- [x] Configure TailwindCSS v4
- [x] Configure `@sveltejs/adapter-cloudflare`
- [x] Set up Drizzle ORM with Turso
- [x] Create route stubs (`/`, `/rewards`, `/vet`, `/dev`, `/auth/*`)
- [x] Configure CSP headers
- [x] Set up rate limits and daily caps
- [x] Configure base design system in `layout.css`

## Phase 1: Core MVP
- [x] Google OAuth full flow (Worker endpoints + Turso session table)
- [x] Habit tracker UI (daily checklists)
- [x] Verification engine (Gemini API endpoint)
- [x] Input validation (MIME, size, metadata strip)
- [x] Gemini prompt hardening (immutable server prompt + structured JSON parsing)
- [x] Points ledger (parameterized queries)

## Phase 2: Gamification
- [ ] Base cat avatar with dynamic states (happy, hungry, sleeping)
- [ ] Customizer UI for layering assets (hats, collars)

## Phase 3: Vet Telehealth
- [ ] AI vet chat interface connected to Gemini
- [ ] Simulated booking UI (spend points, mock Temporal workflows)

## Phase 5: Finalization
- [ ] Run `docs/security.md` pre-deploy checklist
- [ ] Complete `docs/submission.md` checklist
- [ ] Cloudflare Pages deployment
- [ ] Record 5-minute hackathon demo video
