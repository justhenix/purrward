# Purrward Development Roadmap & Edge Cases

## Phase 0: Setup & Infrastructure

- [x] Initialize SvelteKit project using Bun.
- [x] Configure TailwindCSS v4.
- [x] Configure `@sveltejs/adapter-cloudflare` (Pages target).
- [x] Set up Drizzle ORM with Turso (LibSQL) client.
- [x] Add `@inlang/paraglide-js` for i18n generation.
- [x] Add `driver.js` for guided onboarding tours.
- [x] Create route stubs (`/`, `/rewards`, `/vet`, `/dev`, `/auth/*`).
- [x] Create server-side auth + security utility stubs.
- [ ] Set up Google OAuth app in Google Cloud Console.
- [x] Configure CSP headers in Cloudflare Workers.
- [x] Set up verification rate limits and daily caps.
- [x] Configure base design system in the stylesheet imported by `src/routes/+layout.svelte`.
- [x] Update docs that track setup changes: `docs/scaffold.md`, `docs/steps.md`, `docs/design.md`, `docs/assets.md`.

## Phase 1: Core Mechanics (MVP / VIP)

- [x] **Google OAuth**: Implement full flow (Worker endpoints + Turso session table).
- [x] **Habit Tracker UI**: Daily checklists for feeding, water, litter, and medication.
- [x] **Verification Engine**: Cloudflare Worker endpoint calling the Gemini API to verify uploaded photos.
- [x] **Input Validation**: Server-side validation for photo uploads (MIME, size, metadata strip).
- [x] **Gemini Prompt Hardening**: Immutable server prompt and structured JSON response parsing.
- [x] **Points Ledger**: Database logic to award and store `Purrpoints` securely (parameterized queries only).

## Phase 2: Gamification & Avatar (MVP / VIP)

- [ ] **Base Cat Avatar**: Render the user's cat with dynamic states (happy, hungry, sleeping).
- [ ] **Customizer UI**: Interface to layer different assets (hats, collars) on the cat.

## Phase 3: "Halodoc but Vet" Telehealth (MVP / VIP)

- [ ] **AI Vet Chat**: In-app chat interface connected to Gemini for 24/7 symptom triage.
- [ ] **Simulated Booking**: UI to spend points and schedule a "real vet" virtual consultation (mocked via Temporal workflows).

## Phase 4: Expansion & Polish (Good-to-Have)

- [ ] **Dev Mode Toggle**: Component + overlay UI for judges to inspect technical internals.
- [ ] **Security Posture Panel**: Live checklist display in Dev Mode.
- [ ] **Simulated Aikido Compliance**: Mocked scan results in Dev Mode.
- [ ] **Gacha System**: Spend points to roll for random cat accessories.
- [ ] **Web3 Integration**: Phantom wallet connection to mint a custom reward token/NFT on Solana.
- [ ] **Polaroid Scrapbook (Wholesome Flex)**: Personal journal showing verified photo uploads styled as cute polaroid cards.
- [ ] **Co-op Community Goals (Wholesome Flex)**: Global goal bar tracking collective wellness milestones (e.g. 1000 total cat feedings).
- [ ] **Cat Park Showcase (Wholesome Flex)**: Virtual social playground showing other users' customized avatars hanging out (non-competitive).

## Phase 5: Finalization

- [ ] Run [security.md](security.md) pre-deploy checklist.
- [ ] Complete [submission.md](submission.md) checklist.
- [ ] Cloudflare Pages deployment.
- [ ] Record the 5-minute hackathon demonstration video.

---

## MVP (VIP) vs. Good-to-Have

### Mandatory (MVP)

- **Google OAuth + Session Management**
- **Habit Tracker & Photo Uploads**
- **Gemini AI Image Verification** (crucial for anti-cheat)
- **Points System & Database Storage** (Turso)
- **Basic Cat Avatar**
- **AI Vet Chat (Triage)**

### Good-to-Have (Optional / Stretch Goals)

- **Dev Mode** (Temporal viz + security panel + Aikido mock)
- **Polaroid Scrapbook** (Wholesome Flex - High Priority Good-to-Have, easy to build)
- **Co-op Community Goals** (Wholesome Flex - Medium Priority Good-to-Have)
- **Cat Park Showcase** (Wholesome Flex - Low Priority Stretch Goal)
- **Gacha Mechanics**
- **Solana Web3 Incentives**
- **Complex layered animations for the avatar**

---

## Security Edge Cases

Threat scenarios and mitigations live in `docs/security.md`. Keep this file as roadmap/checklist only.
