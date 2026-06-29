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
- [ ] Configure CSP headers in Cloudflare Workers.
- [ ] Set up rate limiting middleware.
- [ ] Configure base design system (Watercolor theme variables in app.css).
- [ ] Update docs that track setup changes: `docs/scaffold.md`, `docs/steps.md`, `docs/design.md`, `docs/assets.md`.

## Phase 1: Core Mechanics (MVP / VIP)
- [ ] **Google OAuth**: Implement full flow (Worker endpoints + Turso session table).
- [ ] **Habit Tracker UI**: Daily checklists for feeding, water, litter, and medication.
- [ ] **Verification Engine**: Cloudflare Worker endpoint calling the Gemini 3.1 Flash Lite API to verify uploaded photos.
- [ ] **Input Validation**: Server-side validation for photo uploads (MIME, size, EXIF strip).
- [ ] **Gemini Prompt Hardening**: Immutable system prompt, sandboxed user input template.
- [ ] **Points Ledger**: Database logic to award and store `Purrpoints` securely (parameterized queries only).

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
- [ ] Run [security.md](file:///d:/DevProj/hackkitty/docs/security.md) pre-deploy checklist.
- [ ] Cloudflare Pages deployment.
- [ ] Record the 5-minute hackathon demonstration video.

---

## MVP (VIP) vs. Good-to-Have

### Mandatory (MVP)
*   **Google OAuth + Session Management**
*   **Habit Tracker & Photo Uploads**
*   **Gemini AI Image Verification** (crucial for anti-cheat)
*   **Points System & Database Storage** (Turso)
*   **Basic Cat Avatar**
*   **AI Vet Chat (Triage)**

### Good-to-Have (Optional / Stretch Goals)
*   **Dev Mode** (Temporal viz + security panel + Aikido mock)
*   **Polaroid Scrapbook** (Wholesome Flex - High Priority Good-to-Have, easy to build)
*   **Co-op Community Goals** (Wholesome Flex - Medium Priority Good-to-Have)
*   **Cat Park Showcase** (Wholesome Flex - Low Priority Stretch Goal)
*   **Gacha Mechanics**
*   **Solana Web3 Incentives**
*   **Complex layered animations for the avatar**

---

## Potential Edge Cases & Mitigations

### 1. The "Fake Photo" Exploit
*   **Scenario**: A user uploads a picture of a dog, a blank screen, or an internet stock photo to farm points.
*   **Mitigation**: The Gemini 3.1 Flash API prompt will be strictly instructed to verify the presence of a cat AND the context of the task (e.g., food bowl). If confidence is low, points are withheld and the user is prompted to try again.

### 2. Point Farming / Spamming
*   **Scenario**: A user clicks the "Feed Cat" task 50 times in one day.
*   **Mitigation**: Implement strict daily caps and rate limiting in the Cloudflare Worker/Turso DB. Once a daily milestone is hit, further tasks yield 0 points.

### 3. AI Vet Jailbreaks or Off-Topic Queries
*   **Scenario**: A user tries to get the AI Vet to write code or answer unrelated prompts.
*   **Mitigation**: Hardcode a rigid system prompt. The AI must politely refuse any query not related to feline health, behavior, or nutrition.

### 4. AI Vet Medical Emergencies
*   **Scenario**: A user types, "My cat is unresponsive and bleeding."
*   **Mitigation**: The AI must detect high-severity keywords and immediately output a red alert banner: *"Seek emergency veterinary care immediately. AI triage cannot handle life-threatening situations."*

### 5. Database Edge Latency or Failure
*   **Scenario**: Turso DB request times out at the edge.
*   **Mitigation**: SvelteKit error boundaries will catch the failure and display a cozy, themed error state (e.g., "The cats are asleep on the server, please refresh").

### 6. Wallet Connection Rejection
*   **Scenario**: A user doesn't have Phantom installed or refuses the Solana connection.
*   **Mitigation**: Graceful degradation. Web3 features are purely optional; the core Web2 point system works independently.

### 7. Prompt Injection via EXIF/Filename
*   **Scenario**: User embeds instructions in photo EXIF data or filename to manipulate Gemini.
*   **Mitigation**: Strip all EXIF metadata server-side. Sanitize filenames. Never pass raw filename or metadata to AI.

### 8. XSS via Community Features
*   **Scenario**: Malicious script injected through cat name, scrapbook caption, or other user-generated text.
*   **Mitigation**: HTML-escape all user-generated content. CSP headers block inline script execution.

### 9. IDOR on Points/User Data
*   **Scenario**: Attacker guesses another user's ID to view or modify their data.
*   **Mitigation**: Server-side session validation. All DB queries use session-derived `user_id`. Never trust client-supplied IDs.

### 10. API Key Leakage in Client Bundle
*   **Scenario**: Gemini API key or Turso credentials accidentally bundled in client-side JavaScript.
*   **Mitigation**: All API calls routed through Cloudflare Workers. Audit build output: `grep -r "AIza\|sk-\|TURSO" .svelte-kit/output`.

### 11. DoS via Massive File Uploads
*   **Scenario**: Attacker sends extremely large files to overwhelm the server.
*   **Mitigation**: 5MB hard limit enforced at Cloudflare Worker level. Reject before processing.

### 12. OAuth Token Theft
*   **Scenario**: Attacker intercepts Google OAuth tokens during the flow.
*   **Mitigation**: HttpOnly session cookies. Tokens never in URL params after callback redirect. State parameter for CSRF protection.

### 13. Session Fixation
*   **Scenario**: Attacker sets a known session ID before the user authenticates.
*   **Mitigation**: Generate new session ID on every login. Invalidate all previous sessions for the user.
