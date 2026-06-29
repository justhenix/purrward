# Purrward: The Care-to-Earn Platform for Feline Wellness

Purrward is a mobile-first Progressive Web App (PWA) that rewards cat owners for maintaining healthy pet routines. This project gamifies pet care (feeding, grooming, medication, vet visits) and offers a virtual vet consultation service ("Halodoc but Vet") where owners can get advice and redeem points for vet discounts/pet rewards.

---

## Why Purrward? (Real-World Benefits)

| Target | Core Benefits |
| :--- | :--- |
| **For the Cat** | • **Consistent Care**: Routine feeding, hydration, and grooming directly boost longevity.<br>• **Preventative Health**: Early symptom detection via AI Vet triage prevents chronic escalation.<br>• **Premium Quality**: Points redeemable for premium kibble, fresh toys, and vet checks.<br>• **Co-op Aid**: Community points directly feed and medicate real shelter cats. |
| **For the Owner** | • **Habit Loop**: Gamified routines reduce pet-parenting stress and mental load.<br>• **Cost Savings**: Subsidized vet consults and pet food coupons (funded by points).<br>• **Peace of Mind**: 24/7 symptom triage acts as a first-line diagnostic companion.<br>• **Wholesome Play**: Cozy, non-stressful virtual connection to a community of cat lovers. |

---

## Technical Stack & Architecture

- **Platform**: SvelteKit (Svelte 5 Runes) + TypeScript.
- **Package Manager & Runtime**: **Bun** (for faster installs, builds, and scripting).
- **CSS Utility**: **TailwindCSS v4** (for fast, responsive, custom styles).
- **Database**: **Turso DB** (LibSQL distributed SQLite) via Drizzle ORM.
- **Hosting & Backend**: Deployed entirely on **Cloudflare Pages/Workers** (using `@sveltejs/adapter-cloudflare`).
- **i18n**: **Paraglide JS** for generated locale helpers in `src/paraglide/`.
- **Guided Tours**: **driver.js** for onboarding flows and feature callouts.
- **AI Engine**: **Gemini 3.1 Flash Lite API** (Free Tier) for anti-cheat task verification and AI Vet triage.
- **Web3 Incentive (Solana)**: Wallet connection (Phantom) to allow users to link their wallet and receive SPL token rewards or NFTs representing milestone achievements (optionally simulated or using `@solana/kit`).

---

## Authentication

- **Google OAuth 2.0** via Cloudflare Workers — frictionless, no password management.
- Flow: Client → Worker `/auth/google` → Google consent → `/auth/callback` → session created.
- Session: HttpOnly + Secure + SameSite=Strict cookie → Turso session table.
- Full spec → [security.md](file:///d:/DevProj/hackkitty/docs/security.md)

---

## User Mode vs Dev Mode

- **User Mode** (default): Full app experience — habit tracker, avatar, vet chat, rewards.
- **Dev Mode**: Toggle via footer icon or `/dev` route. Shows:
  - Simulated Temporal workflow visualizer (photo verification flow, appointment scheduling)
  - Security posture panel (live checklist of active protections)
  - Cloudflare Worker execution trace (mocked)
  - Aikido-style scan results (mocked compliance dashboard)
- Dev Mode is supplementary — not a main feature. It exists to demonstrate technical depth to judges.

---

## Security

Full architecture → [security.md](file:///d:/DevProj/hackkitty/docs/security.md)

Summary: Google OAuth, CSP headers, CORS allowlist, input validation at Worker boundary, EXIF stripping, prompt injection defense, rate limiting, parameterized DB queries, IDOR prevention.

---

## Design Aesthetic
1. **Option 1: Cozy Watercolor**
   - *Style*: Soft pastel gradients, textured canvas backgrounds, organic wavy lines, and watercolor splash shapes.

---

## Key Features

1. **Layered Cat Avatar Customizer & Gacha Store**:
   - Customizable cat avatar that grows and changes level.
   - Mix-and-match outfits and accessories (PNG/SVG layers) matching the selected art style.
   - A Gacha system where users spend earned `Purrpoints` to roll for new randomized cat items.
2. **Anti-Cheat Habit Tracker (Gemini Verification)**:
   - Checklists for daily habits (Feeding, Water, Litter box, Play, Grooming, Meds).
   - Users upload a photo for proof; a Cloudflare worker sends it to the Gemini 3.1 Flash Lite API to verify task completion and filter out fake/stock photos.
3. **Purrpoints & Reward Store**:
   - Earn points for verified routines.
   - Redeem points for vet checkup discounts, online consults, and pet store coupons.
4. **Hybrid Telehealth ("Halodoc but Vet")**:
   - **AI Vet Chat**: 24/7 symptom triage powered by Gemini.
   - **Simulated Real Vet Booking**: Book a consult with a licensed professional using points, managing the lifecycle via Temporal scheduler workflows.
5. **Wholesome Flexing (Community & Milestones)**:
   - **Polaroid Scrapbook (Nice-to-Have - High Priority)**: A cozy personal gallery archiving the user's verified photo uploads in stylized watercolor polaroid frames with date stamps.
   - **Co-op Community Goals (Nice-to-Have - Medium Priority)**: A collaborative global tracker where all users' verified pet actions contribute to shared goals (e.g., donating kibble to local shelters).
   - **Cat Park Showcase (Nice-to-Have - Low Priority / Stretch)**: A non-competitive virtual park page where customized cat avatars from different users hang out together in a cozy watercolor scenery.

---

## Project Structure

```
d:/DevProj/hackkitty/
├── .agents/
│   └── AGENTS.md                          # Agent rules (auto-discovered)
├── docs/
│   ├── scaffold.md                        # This file
│   ├── steps.md                           # Dev roadmap & edge cases
│   ├── security.md                        # Security architecture
│   ├── design.md                          # Design spec (TODO)
│   └── assets.md                          # Asset inventory (TODO)
├── src/
│   ├── app.html                           # Main HTML template
│   ├── app.d.ts                           # SvelteKit type declarations
│   ├── paraglide/                         # Generated locale helpers and messages
│   ├── lib/
│   │   ├── index.ts                       # Lib barrel export
│   │   ├── assets/                        # Static assets (images, etc.)
│   │   ├── onboarding/                    # driver.js tour setup and step configs
│   │   ├── server/
│   │   │   ├── auth.ts                    # SECURITY: session validation, cookies
│   │   │   ├── security.ts               # SECURITY: sanitization, rate limiting
│   │   │   └── db/                        # Drizzle schema + connection (auto-generated)
│   │   └── components/                    # Svelte components (TODO)
│   └── routes/
│       ├── +layout.svelte                 # Root layout (imports Tailwind, global state)
│       ├── +page.svelte                   # Dashboard home (avatar + habit tracker)
│       ├── rewards/+page.svelte           # Reward store
│       ├── vet/+page.svelte               # AI Vet chat
│       ├── dev/+page.svelte               # Dev Mode overlay
│       ├── auth/
│       │   ├── google/+server.ts          # SECURITY: OAuth initiation
│       │   └── callback/+server.ts        # SECURITY: OAuth callback
├── static/                                # Static public files
├── drizzle.config.ts                      # Drizzle ORM config (Turso)
├── wrangler.jsonc                         # Cloudflare Workers config
├── package.json                           # Dependencies & scripts
└── tsconfig.json                          # TypeScript config
```

---

## Verification Plan

### Automated Tests
- Build verification tests for habit state changes and reward point calculation.
- Run `bun test` for rapid test execution.

### Manual Verification
- Test interactive photo upload modal and verification state transition.
- Verify vet chat response flow and appointment scheduling.
- Verify aesthetic responsiveness on mobile preview mode.
