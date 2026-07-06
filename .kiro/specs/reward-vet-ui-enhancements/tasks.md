# Implementation Plan: Reward & Vet UI Enhancements

## Overview

This plan implements ten layered enhancements onto the existing Purrward MVP in TypeScript/SvelteKit 5 (runes only). Work is ordered so pure, server-owned logic and schema come first, then DB services, then rate-limited endpoints, then the Svelte presentation layer. Every new file gets a one-line header comment, all colors flow through `layout.css` tokens, all mutations use Drizzle query builders behind server services, and security-critical paths carry `// SECURITY:` comments.

Pure modules (`theme.ts`, `coupon-trade.ts` transition logic via `tradeCoupon`, `featured.ts`, `menu-audit.ts`) are property-tested against the 19 correctness properties in the design. DB-touching services use in-memory LibSQL integration tests matching the existing `*.spec.ts` pattern (`inventory.spec.ts`, `gacha.spec.ts`). UI surfaces use example-based component tests.

Verify before handoff: `bun run check`, `bun test`, `bun run lint`.

## Tasks

- [x] 1. Database schema and migrations
  - [x] 1.1 Add `partners` table to Drizzle schema
    - In `src/lib/server/db/schema.ts` define `partners` (`id` uuid PK, `name`, `category`, `address`, `mapX`/`map_x` int, `mapY`/`map_y` int, `createdAt`) with `partners_category_idx` on `category`
    - _Requirements: 3.1_
  - [x] 1.2 Extend `reward_redemptions` with trade columns
    - Add nullable `usedAt`/`used_at` (int) and `partnerId`/`partner_id` (text) columns; keep `status` defaulting to `active`
    - _Requirements: 4.1, 4.2_
  - [x] 1.3 Generate migrations and seed demo partners
    - Create the two Drizzle migrations under `drizzle/` (create partners + category index with a seed insert of vet/treat/toy/shelter partners; alter reward_redemptions add used_at, partner_id)
    - _Requirements: 3.1, 3.2_

- [x] 2. Theme resolution pure module
  - [x] 2.1 Implement `src/lib/theme.ts`
    - New file with header comment; export `ThemePreference`, `AppliedTheme`, `isThemePreference`, `normalizeTheme`, `resolveTheme`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]\* 2.2 Write property tests for theme resolution
    - **Property 1: Theme normalization is total and stable** — Validates: Requirements 1.1
    - **Property 2: Theme resolution honors preference and system scheme** — Validates: Requirements 1.2, 1.3, 1.4
    - Min 100 iterations plus targeted edge examples
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Featured rewards rotator pure module
  - [x] 3.1 Implement `src/lib/featured.ts`
    - New file with header comment; export `ROTATION_DAYS`, `currentPeriodIndex`, `daysUntilNextRotation`, `featuredRewardIds`, and the `mulberry32`-seeded `seededShuffle`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]\* 3.2 Write property tests for the rotator
    - **Property 16: Featured selection is a deterministic subset per period** — Validates: Requirements 9.1, 9.3, 9.4
    - **Property 17: Rotation countdown is a whole number of days in range** — Validates: Requirements 9.5
    - **Property 18: Featured view never removes catalog items** — Validates: Requirements 9.6
    - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.6_

- [x] 4. Menu audit pure module
  - [x] 4.1 Implement `src/lib/server/menu-audit.ts`
    - New file with header comment; export `MenuDescriptor`, `MenuFlag`, `MIN_MENU_ITEMS`, `flagShortMenus`
    - _Requirements: 10.3_
  - [ ]\* 4.2 Write property test for menu auditing
    - **Property 19: Short menus are flagged exactly** — Validates: Requirements 10.3
    - _Requirements: 10.3_

- [x] 5. Preferences theme persistence
  - [x] 5.1 Extend `src/lib/server/preferences.ts` with `theme`
    - Add `theme: ThemePreference` to `Preferences`; append a fifth colon-delimited segment to (de)serialization; missing segment parses to `system` (no migration)
    - _Requirements: 1.5_
  - [ ]\* 5.2 Write property test for preferences round-trip
    - **Property 3: Preferences round-trip preserves theme** — Validates: Requirements 1.5
    - _Requirements: 1.5_

- [x] 6. Checkpoint - pure logic and schema
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Per-cat scene backgrounds
  - [x] 7.1 Add background catalog entries
    - In `src/lib/server/catalog.ts` add `bg_window` and `bg_garden` (`kind: 'background'`) so the catalog has two or more beyond `bg_home`; confirm `DEFAULT_BACKGROUND_ID = 'bg_home'`
    - _Requirements: 2.1, 2.3_
  - [ ]\* 7.2 Write integration tests for background selection
    - In-memory LibSQL test reusing `equipItem({ slot: 'background' })`
    - **Property 4: Backgrounds default to home when unset** — Validates: Requirements 2.3
    - **Property 5: Owned background selection persists** — Validates: Requirements 2.2
    - **Property 6: Invalid or unowned backgrounds are rejected without side effects** — Validates: Requirements 2.4, 2.5
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 8. Partner directory service
  - [x] 8.1 Implement `src/lib/server/partners.ts`
    - New file with header comment; export `Partner`, `listPartners(db)`, `findPartner(db, id)` using Drizzle builders; `findPartner` narrows `unknown` id
    - _Requirements: 3.2, 3.3_
  - [ ]\* 8.2 Write integration tests for partner queries
    - In-memory LibSQL test: seed partners, assert `listPartners` returns all and `findPartner` resolves/rejects ids
    - _Requirements: 3.2, 3.3_

- [x] 9. Coupon-trade service
  - [x] 9.1 Implement `tradeCoupon` in `src/lib/server/coupon-trade.ts`
    - New file with header comment; `// SECURITY:` server-owned active→used transition via a single conditional Drizzle UPDATE (`WHERE id AND user_id AND status='active'`), sets `status='used'`, `used_at`, `partner_id`; validate partner exists (400); disambiguate zero-row updates into 403 (not owned) vs 409 (not active); export `TradeResult`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]\* 9.2 Write integration tests for `tradeCoupon`
    - In-memory LibSQL test covering the state transition and guard branches
    - **Property 8: Trading an active coupon marks it used and records the partner** — Validates: Requirements 4.1, 4.2
    - **Property 9: Only active coupons transition; repeats conflict** — Validates: Requirements 4.3
    - **Property 10: Coupons can only be traded by their owner** — Validates: Requirements 4.4
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 9.3 Add `listRedemptions` to `src/lib/server/coupon-trade.ts`
    - Export `RedemptionRow` and `listRedemptions(db, userId)` using `select().from(rewardRedemptions).where(eq(userId)).orderBy(desc(createdAt))`, resolving `title` from the catalog by `rewardId`
    - _Requirements: 8.1_
  - [ ]\* 9.4 Write integration test for `listRedemptions`
    - In-memory LibSQL test with redemptions across multiple users
    - **Property 13: History returns exactly the user's redemptions** — Validates: Requirements 8.1
    - _Requirements: 8.1_

- [x] 10. Checkpoint - services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Protected endpoints
  - [x] 11.1 Create `POST /api/preferences/theme`
    - New `src/routes/api/preferences/theme/+server.ts` with header comment; validate `theme` form field with `isThemePreference`, merge into preferences, re-set `purrward_prefs` cookie with HttpOnly/Secure/SameSite=Strict; return `{ theme }` (covered by global `/api/*` IP limiter)
    - _Requirements: 1.5_
  - [x] 11.2 Create `POST /api/rewards/trade`
    - New `src/routes/api/rewards/trade/+server.ts` with header comment; 401 if unauthenticated; sandbox mode returns ephemeral success (no writes); `// SECURITY:` per-user `checkRateLimit({ action: 'coupon_trade' })` keyed by hashed user id returning `Retry-After` on 429; delegate to `tradeCoupon` and map `TradeResult` to JSON + status
    - _Requirements: 4.6, 4.1, 4.2, 4.3, 4.4_

- [x] 12. App-wide theme UI
  - [x] 12.1 Add dark tokens and scoping to `src/routes/layout.css`
    - Declare `--color-dark-*` tokens; remap base `--color-*` under `:root[data-theme='dark']` and under `@media (prefers-color-scheme: dark)` scoped to `:root[data-theme='system']`
    - _Requirements: 1.7, 1.2, 1.3, 1.4_
  - [x] 12.2 Stamp `data-theme` in `src/hooks.server.ts`
    - Read persisted `theme` from `purrward_prefs`; set `data-theme` on `<html>` during SSR via `transformPageChunk` (before first paint, no inline script)
    - _Requirements: 1.6_
  - [x] 12.3 Create `src/lib/components/ThemeToggle.svelte`
    - New runes-only component with header comment; `$props` for current theme, `$state` optimistic UI; `onclick` sets `document.documentElement.dataset.theme` immediately then `POST`s to `/api/preferences/theme`; no `on:` handlers
    - _Requirements: 1.1, 1.5_
  - [x] 12.4 Integrate `ThemeToggle` in `src/routes/+layout.svelte`
    - Render the toggle and apply the optimistic `data-theme` attribute so the persisted preference holds before first paint
    - _Requirements: 1.6_

- [x] 13. Partner map mockup UI
  - [x] 13.1 Create `src/routes/rewards/partners/+page.server.ts`
    - New file with header comment; `load()` returns `listPartners(db)`
    - _Requirements: 3.2_
  - [x] 13.2 Create `src/routes/rewards/partners/+page.svelte`
    - New runes-only view with header comment; render each partner as an absolutely-positioned pin (`left: mapX/10%`, `top: mapY/10%`) over a token-styled backdrop showing the partner name; empty-state card when no partners
    - _Requirements: 3.2, 3.3, 3.4_
  - [ ]\* 13.3 Write component test for the partner map
    - **Property 7: Every partner renders as one named pin** — Validates: Requirements 3.2, 3.3
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 14. Vet chat polish, clinics, and triage chips
  - [x] 14.1 Polish medical-chat vet UI in `src/routes/vet/+page.svelte`
    - Audit `.message-row.user`/`.message-row.vet` bubbles for tokens-only colors; keep typing indicator while `sending`; autoscroll newest via `$effect` on `chats.length`; keep the triage-only disclaimer always visible in AI mode; render `- Label:` guidance lines as bullets via `parseReply`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]\* 14.2 Write property test for `parseReply`
    - **Property 11: Labeled vet guidance parses into intro plus bullets** — Validates: Requirements 5.5
    - _Requirements: 5.5_
  - [x] 14.3 Reduce triage suggestion chips to exactly three
    - In `src/routes/vet/+page.svelte` set `suggestions` to exactly three prompts; `selectSuggestion` still starts a triage question from the chip
    - _Requirements: 7.1, 7.2_
  - [x] 14.4 Create `src/lib/vet-clinics.ts`
    - New file with header comment; export `Clinic` type and `CLINICS` static constant (>= 2 entries: name, specialty, distanceKm)
    - _Requirements: 6.1_
  - [x] 14.5 Add clinic directory and mock booking to `src/routes/vet/+page.svelte`
    - In `human` mode render clinic cards (name, specialty, distance) each with a Book/Consult action; `$state`-driven mock booking modal with date/time picker; completing it shows a confirmation panel naming the clinic; modal closed via `onclick`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]\* 14.6 Write component test for clinic cards
    - **Property 12: Clinic cards expose name, specialty, and distance** — Validates: Requirements 6.1
    - _Requirements: 6.1_

- [x] 15. Reward history / claimed view
  - [x] 15.1 Create `src/routes/rewards/history/+page.server.ts`
    - New file with header comment; `load()` calls `listRedemptions(db, userId)`; returns a sign-in prompt flag when unauthenticated
    - _Requirements: 8.1, 8.5_
  - [x] 15.2 Create `src/routes/rewards/history/+page.svelte`
    - New runes-only view with header comment; list rows showing reward title, code, status; token-based status pills distinguishing `active` vs `used`; `active` rows expose a Use/Trade action opening a partner picker that calls `/api/rewards/trade`; unauthenticated users see a sign-in prompt
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  - [ ]\* 15.3 Write component test for the history view
    - **Property 14: History rows display title, code, and status** — Validates: Requirements 8.2
    - **Property 15: Status styling and trade action track redemption status** — Validates: Requirements 8.3, 8.4
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 16. Featured rewards on the rewards page
  - [x] 16.1 Extend `src/routes/rewards/+page.server.ts`
    - Compute the featured id set via `featuredRewardIds` and the countdown via `daysUntilNextRotation` at load; keep the full catalog in the returned data
    - _Requirements: 9.1, 9.5, 9.6_
  - [x] 16.2 Extend `src/routes/rewards/+page.svelte`
    - Render a "Featured this week" strip plus the whole-days countdown; keep the full reward grid browsable; add a link/tab to `rewards/history`
    - _Requirements: 9.5, 9.6, 8.4_

- [x] 17. QA sweep runner
  - [x] 17.1 Create `scripts/qa-sweep.ts`
    - New file with header comment; enumerate navigable routes (bottom-nav plus `rewards/history`, `rewards/partners`, vet sub-modes), `GET` against a running dev server, record any 500; combine with `flagShortMenus` over a declared menu inventory; print a single report of all 500s and flagged menus. Run manually, never in the request path
    - _Requirements: 10.1, 10.2, 10.4_

- [x] 18. Final checkpoint
  - Ensure `bun run check`, `bun test`, and `bun run lint` all pass; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific granular requirements for traceability.
- Property tests (min 100 iterations) cover the pure modules and the `tradeCoupon` transition; DB services use in-memory LibSQL integration tests matching the existing `*.spec.ts` pattern; UI uses example-based component tests.
- Per-cat backgrounds add no new server logic beyond catalog entries — existing `equipItem` guards satisfy Req 2.2/2.4/2.5.
- All new files carry a one-line header comment; colors use `layout.css` tokens only; security-critical paths carry `// SECURITY:` comments; protected endpoints are rate limited.

## Task Dependency Graph

```json
{
	"waves": [
		{ "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "5.1", "7.1", "12.1", "14.4"] },
		{
			"id": 1,
			"tasks": ["1.2", "2.2", "3.2", "4.2", "5.2", "8.1", "12.2", "12.3", "14.1", "17.1"]
		},
		{ "id": 2, "tasks": ["1.3", "7.2", "8.2", "9.1", "11.1", "12.4", "13.1", "14.3", "16.1"] },
		{ "id": 3, "tasks": ["9.2", "9.3", "11.2", "13.2", "14.5", "16.2"] },
		{ "id": 4, "tasks": ["9.4", "13.3", "14.2", "14.6", "15.1"] },
		{ "id": 5, "tasks": ["15.2"] },
		{ "id": 6, "tasks": ["15.3"] }
	]
}
```
