# Design Document

## Overview

This feature bundles ten UI and product enhancements onto the existing Purrward MVP. The work is deliberately layered so that pure, server-owned logic (theme resolution, coupon-trade state transitions, featured-reward rotation, menu auditing) is separated from the Svelte 5 presentation layer. Every color flows through `layout.css` design tokens, all point/code/status mutations stay server-side behind Drizzle query builders, and every new protected endpoint is rate limited.

The design reuses existing infrastructure wherever possible:

- **Preferences**: theme is added as a fifth segment to the `purrward_prefs` cookie handled by `src/lib/server/preferences.ts` (the same mechanism that stores `sandboxMode`).
- **Inventory / equip**: per-cat background selection reuses the existing `equipItem` flow (`src/lib/server/inventory.ts`) which already enforces catalog allowlisting and account-wide ownership.
- **Rate limiting**: coupon trades reuse the DB-backed `checkRateLimit` helper keyed by hashed user id (same pattern as `checkRedeemRateLimit`).
- **Redemptions**: the coupon-trade flow extends the existing `reward_redemptions` table (which already has a `status` column defaulting to `active`).

Nothing here is a "Good-to-Have" scope item; all of it extends MVP reward/vet surfaces.

### Goals

- Ship an app-wide light/dark/system theme applied before first paint with no flash.
- Give each cat a choice of scene backgrounds beyond `bg_home`.
- Introduce a partner directory + map mockup and a safe, server-owned coupon-trade flow.
- Polish the AI vet chat into a clean medical-chat experience and add a clinic directory with a mock booking flow.
- Reduce triage suggestion chips to exactly three.
- Add a reward history / claimed view and rotating featured rewards with a countdown.
- Provide a repeatable QA sweep that catches 500s and awkward menus before demo.

### Non-Goals

- Real payment, real bookings, or real partner integrations (coupons only; booking is a mock).
- Dispensing physical food or goods directly (rewards are coupons per steering).
- Real geolocation / mapping providers (the map is a stylized mockup with normalized coordinates).

## Steering Alignment

| Constraint                       | How the design honors it                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Svelte 5 runes only              | All new components use `$state`, `$derived`, `$effect`, `$props`; no `$:`, no UI stores, no `createEventDispatcher`, no `on:` handlers. |
| TypeScript strict, no `any`      | All new modules export explicit types; parsing uses discriminated unions and `unknown` narrowing.                                       |
| One-line file header             | Every new file begins with a single `// ...` (or `<!-- ... -->`) purpose comment.                                                       |
| `layout.css` tokens only         | Dark mode remaps existing `--color-*` tokens; components reference tokens, never hex.                                                   |
| Server-owned points/codes/status | Trade status transitions happen only inside server services via Drizzle; clients send ids, never values.                                |
| Drizzle query builders           | All new queries use the builder API; no string interpolation.                                                                           |
| Rate-limited endpoints           | `/api/rewards/trade` is per-user rate limited; theme endpoint is covered by the global IP limiter.                                      |
| `// SECURITY:` comments          | Ownership checks, status guards, and rate limits are annotated.                                                                         |
| Rewards are coupons              | The trade service and history view present coupons; no physical dispensing path exists.                                                 |

## Architecture

```
                         ┌───────────────────────────────────────────┐
                         │                Presentation                │
                         │  (Svelte 5 runes, layout.css tokens only)   │
                         ├───────────────────────────────────────────┤
 ThemeToggle ◄───────────┤ rewards/ (+featured rotator, history link) │
 (layout)                │ rewards/history/  rewards/partners/         │
                         │ vet/ (chat polish, 3 chips, clinic dir)     │
                         └───────┬─────────────────────────┬───────────┘
                                 │ fetch                    │ load()
                     ┌───────────▼───────────┐   ┌──────────▼───────────┐
                     │      Endpoints        │   │   Server load()      │
                     │ /api/preferences/theme│   │ +layout.server.ts    │
                     │ /api/rewards/trade    │   │ rewards[/history]    │
                     └───────────┬───────────┘   │ rewards/partners     │
                                 │               └──────────┬───────────┘
                     ┌───────────▼───────────────────────────▼─────────┐
                     │              Server Logic (pure + DB)            │
                     │ preferences.ts (theme)   theme.ts (resolve)      │
                     │ coupon-trade.ts          partners.ts             │
                     │ featured.ts (rotator)    menu-audit.ts (QA)      │
                     │ inventory.ts (reuse)     rate-limit.ts (reuse)   │
                     └───────────┬─────────────────────────────────────┘
                                 │ Drizzle query builders
                     ┌───────────▼───────────┐
                     │   Turso / LibSQL      │
                     │ partners (new)        │
                     │ reward_redemptions    │
                     │  (+usedAt,+partnerId) │
                     └───────────────────────┘
```

### Theme-before-first-paint strategy

The active theme must be correct on the very first paint (Req 1.6) with no client round-trip flash. The design achieves this **without an inline script** (which would otherwise need a CSP nonce) by:

1. Reading the persisted `theme` preference from the HttpOnly `purrward_prefs` cookie server-side.
2. Stamping `data-theme="light|dark|system"` onto the `<html>` element during SSR via `transformPageChunk` in `hooks.server.ts`.
3. Resolving colors purely in CSS: `[data-theme='dark']` applies dark tokens, and `@media (prefers-color-scheme: dark)` scoped to `[data-theme='system']` handles the `system` case. Because the media query is evaluated by the browser before paint, `system` needs no JavaScript.

This keeps `system` correct on first paint and avoids a flash-of-wrong-theme even for server-rendered pages.

## Components and Interfaces

### 1. Theme Manager

**Files**

- `src/lib/server/preferences.ts` (extend): add `theme: ThemePreference` to `Preferences` and to (de)serialization.
- `src/lib/theme.ts` (new): `// Pure theme-preference resolution shared by server and client.`
- `src/routes/api/preferences/theme/+server.ts` (new): persist theme selection.
- `src/lib/components/ThemeToggle.svelte` (new): segmented light/dark/system control.
- `src/routes/layout.css` (extend): `--color-dark-*` tokens + theme scoping.
- `src/hooks.server.ts` (extend): stamp `data-theme` on `<html>`.
- `src/routes/+layout.svelte` (extend): render `ThemeToggle`, apply optimistic attribute.

**Types & pure logic (`theme.ts`)**

```ts
// Pure theme-preference resolution shared by server and client.
export type ThemePreference = 'light' | 'dark' | 'system';
export type AppliedTheme = 'light' | 'dark';

const THEME_VALUES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function isThemePreference(value: unknown): value is ThemePreference {
	return typeof value === 'string' && (THEME_VALUES as readonly string[]).includes(value);
}

export function normalizeTheme(value: unknown): ThemePreference {
	return isThemePreference(value) ? value : 'system';
}

// The single source of truth for what tokens get applied.
export function resolveTheme(pref: ThemePreference, systemPrefersDark: boolean): AppliedTheme {
	if (pref === 'dark') return 'dark';
	if (pref === 'light') return 'light';
	return systemPrefersDark ? 'dark' : 'light';
}
```

**Preferences serialization (extend)**

`purrward_prefs` is a colon-delimited string. A fifth segment is appended for theme; parsing tolerates a missing segment (older cookies) by defaulting to `system`, so no migration is required.

```ts
export type Preferences = {
	careReminders: boolean;
	sandboxMode: boolean;
	avatarChoice: AvatarChoice;
	reminderTime: string;
	theme: ThemePreference; // new — defaults to 'system'
};
// serialize: `${careReminders}:${sandbox}:${avatar}:${time}:${theme}`
```

**Endpoint** `POST /api/preferences/theme`

- Accepts form field `theme`; validates with `isThemePreference`.
- Merges into current preferences and re-sets the `purrward_prefs` cookie with the same HttpOnly/Secure/SameSite=Strict flags used elsewhere.
- Returns `{ theme }`. Covered by the global `/api/*` IP rate limiter.

**`ThemeToggle.svelte`** uses `$props` for the current theme and `$state` for optimistic UI. On selection it sets `document.documentElement.dataset.theme` immediately (no flash), then `POST`s to persist. No `on:` handlers — uses `onclick`.

**CSS token scoping (`layout.css`)** — dark tokens are declared as `--color-dark-*` per Req 1.7, then base tokens are remapped when dark is active:

```css
@theme {
	/* existing light tokens ... */
	--color-dark-bg: #1f2322;
	--color-dark-surface: #2a2f2e;
	--color-dark-surface-2: #333938;
	--color-dark-text: #f8f1e6;
	--color-dark-muted: #c7bfb2;
	--color-dark-line: #444b49;
}

/* Explicit dark selection */
:root[data-theme='dark'] {
	--color-paper: var(--color-dark-bg);
	--color-paper-2: var(--color-dark-surface);
	--color-paper-3: var(--color-dark-surface-2);
	--color-ink: var(--color-dark-text);
	--color-muted: var(--color-dark-muted);
	--color-line: var(--color-dark-line);
	/* charcoal surfaces (nav, primary buttons) lighten for contrast on dark */
}

/* System selection follows the OS, evaluated before paint */
@media (prefers-color-scheme: dark) {
	:root[data-theme='system'] {
		--color-paper: var(--color-dark-bg);
		/* ...same remap as [data-theme='dark'] ... */
	}
}
```

Because components already consume `--color-paper*`, `--color-ink`, `--color-line`, etc., remapping the tokens themes the whole app with no per-component changes.

### 2. Per-cat Scene Backgrounds

**Files**

- `src/lib/server/catalog.ts` (extend): add two or more `kind: 'background'` entries beyond `bg_home`.
- Reuse `src/lib/server/inventory.ts` `equipItem({ slot: 'background' })` and `src/routes/api/shop/equip` (existing equip endpoint) for selection.

The catalog currently ships `bg_home` (default) and `bg_park`. Add at least two more scene backgrounds so the catalog has "two or more beyond `bg_home`" (Req 2.1):

```ts
{ id: 'bg_window', title: 'Sunny Windowsill', cost: 80, desc: 'A warm perch by the glass.', kind: 'background' },
{ id: 'bg_garden', title: 'Garden Nook',      cost: 100, desc: 'Green and breezy.',        kind: 'background' }
// (bg_park already exists)
```

Selection persists to `cats.backgroundId` via the existing `applyCatEquip` Drizzle update (Req 2.2). The existing render-time default (`DEFAULT_BACKGROUND_ID = 'bg_home'`) already covers the null case (Req 2.3). `equipItem` already:

- Rejects ids not present in the catalog for the background slot (`isBackgroundId`) → Req 2.4.
- Rejects items not owned in the user's inventory with a 403 authorization error → Req 2.5.

No new server logic is needed beyond catalog entries; the design records that these existing guards satisfy 2.2/2.4/2.5.

### 3. Partner Directory + Map Mockup

**Files**

- `src/lib/server/db/schema.ts` (extend): new `partners` table.
- `src/lib/server/partners.ts` (new): `// Server-owned partner directory queries + seed data.`
- `src/routes/rewards/partners/+page.server.ts` (new): load partners.
- `src/routes/rewards/partners/+page.svelte` (new): map mockup with location pins.

**Schema**

```ts
// Partner businesses where coupons can be redeemed; rendered on the map mockup.
export const partners = sqliteTable(
	'partners',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: text('name').notNull(),
		category: text('category').notNull(), // 'vet' | 'treat' | 'toy' | 'shelter'
		address: text('address').notNull(),
		// Normalized 0..1 coordinates for the stylized map mockup (not real geo).
		mapX: integer('map_x').notNull(), // stored as 0..1000 to stay integer-safe
		mapY: integer('map_y').notNull(),
		createdAt: integer('created_at').notNull()
	},
	(table) => [index('partners_category_idx').on(table.category)]
);
```

**Service (`partners.ts`)**

```ts
export type Partner = {
	id: string;
	name: string;
	category: string;
	address: string;
	mapX: number;
	mapY: number;
};
export async function listPartners(database: Database): Promise<Partner[]> {
	/* select().from(partners) */
}
export async function findPartner(database: Database, id: unknown): Promise<Partner | null> {
	/* eq(partners.id, id) */
}
```

**Map view** renders each partner as an absolutely-positioned pin (`left: mapX/10%`, `top: mapY/10%`) over a token-styled backdrop. Each pin shows the partner name (Req 3.3). When `partners` is empty, an empty-state card is shown (Req 3.4).

Seed data is inserted via a Drizzle migration seed (a handful of vet/treat/toy/shelter partners) so the map is populated for the demo.

### 4. Coupon-Trade Service

**Files**

- `src/lib/server/db/schema.ts` (extend): add `usedAt` and `partnerId` to `reward_redemptions`.
- `src/lib/server/coupon-trade.ts` (new): `// SECURITY: server-owned coupon redemption -> used state transition.`
- `src/routes/api/rewards/trade/+server.ts` (new): authenticated, rate-limited trade endpoint.

**Schema additions**

```ts
// reward_redemptions gains:
usedAt: integer('used_at'),          // null while active; set when traded
partnerId: text('partner_id')        // null while active; the redeeming partner
```

**Service**

```ts
export type TradeResult =
	| { ok: true; redemptionId: string; partnerId: string; status: 'used' }
	| { ok: false; status: number; error: string };

// SECURITY: status transition + ownership + partner validity are all server-enforced.
export async function tradeCoupon(input: {
	database: Database;
	userId: string;
	redemptionId: unknown;
	partnerId: unknown;
	now?: number;
}): Promise<TradeResult> {
	// 1. validate partner exists (400 if not).
	// 2. conditional UPDATE ... WHERE id = ? AND user_id = ? AND status = 'active'
	//    SET status = 'used', used_at = now, partner_id = ?  (returning id).
	// 3. if 0 rows updated, disambiguate:
	//      - row not found or not owned  -> 403 authorization error
	//      - row exists but status != active -> 409 conflict error
}
```

The single conditional `UPDATE` guarantees the active→used transition is atomic (Req 4.1) and records the partner (Req 4.2). When it matches zero rows the service issues a follow-up ownership/status read to return the correct error: not-owned → 403 (Req 4.4), already-used/expired → 409 (Req 4.3). Rewards are always presented as coupons; there is no code path that dispenses physical goods (Req 4.5).

**Endpoint** `POST /api/rewards/trade`

- 401 if unauthenticated.
- Sandbox mode returns an ephemeral success (no DB writes), matching the redeem endpoint pattern.
- `// SECURITY:` per-user rate limit via `checkRateLimit({ action: 'coupon_trade', ... })` keyed by hashed user id, returning `Retry-After` on 429 (Req 4.6).
- Delegates to `tradeCoupon`; maps `TradeResult` to JSON + status.

### 5. Polished Medical-Chat Vet UI

**File**: `src/routes/vet/+page.svelte` (refine existing).

The current chat already has distinct bubbles, a typing indicator, autoscroll, a disclaimer, and bullet parsing. This requirement is largely a polish pass that formalizes those behaviors against the acceptance criteria:

- Distinct `.message-row.user` / `.message-row.vet` bubbles using tokens only (Req 5.1) — already present; audited for token usage.
- Typing indicator while `sending` (Req 5.2) — already present.
- Autoscroll newest into view via the existing `$effect` on `chats.length` (Req 5.3).
- Persistent triage-only disclaimer "Triage only. Call a vet for care." (Req 5.4) — already present; kept visible.
- Labeled guidance lines (`Likely` / `Watch` / `Vet now`) rendered as scannable bullets via `parseReply` (Req 5.5) — already present.

Polish work: refine spacing, ensure disclaimer is always visible in AI mode, verify all colors are tokens, and confirm bubbles read well under dark theme.

### 6. Clinic / Vet Directory + Mock Booking

**Files**

- `src/lib/vet-clinics.ts` (new): `// Static mock clinic directory for the vet-visit-help mode.`
- `src/routes/vet/+page.svelte` (extend): render clinic cards + booking modal in `human` mode.

Booking is a pure client-side mock (no DB, no network), so clinics are a static typed constant:

```ts
export type Clinic = { id: string; name: string; specialty: string; distanceKm: number };
export const CLINICS: Clinic[] = [
	/* >= 2 entries: name, specialty, distanceKm */
];
```

In `human` mode the page shows clinic cards, each with name, specialty, and distance (Req 6.1) and a "Book" / "Consult" action (Req 6.2). Activating "Book" opens a mock booking interaction (`$state` driven modal with a date/time picker) for that clinic (Req 6.3). Completing it shows a confirmation panel naming the selected clinic (Req 6.4). All state is runes; the modal is toggled with `$state` and closed via `onclick`.

### 7. Exactly Three Triage Chips

**File**: `src/routes/vet/+page.svelte` (edit the `suggestions` constant).

Change the four-item `suggestions` array to exactly three prompts (Req 7.1):

```ts
const suggestions = ['Not eating today', 'Throwing up', 'Scratching a lot'];
```

Selecting a chip continues to start a triage question via `selectSuggestion` (Req 7.2). The layout skeleton's decorative chip count is cosmetic and left as-is.

### 8. Reward History / Claimed View

**Files**

- `src/lib/server/coupon-trade.ts` (add): `listRedemptions(db, userId)`.
- `src/routes/rewards/history/+page.server.ts` (new): load the user's redemptions.
- `src/routes/rewards/history/+page.svelte` (new): history list + use/trade action.
- `src/routes/rewards/+page.svelte` (extend): add a link/tab to history.

**Query**

```ts
export type RedemptionRow = {
	id: string;
	rewardId: string;
	title: string;
	code: string;
	status: string;
	partnerId: string | null;
	usedAt: number | null;
	createdAt: number;
};
// select().from(rewardRedemptions).where(eq(userId)).orderBy(desc(createdAt))
// title resolved from the catalog by rewardId.
export async function listRedemptions(database: Database, userId: string): Promise<RedemptionRow[]>;
```

**View**

- Lists redemption rows via the Drizzle query (Req 8.1).
- Each row shows reward title, code, and status (Req 8.2).
- `active` vs `used` rows are visually distinguished with token-based status pills (Req 8.3).
- `active` rows expose a "Use / Trade" action that opens a partner picker and calls `/api/rewards/trade` (Req 8.4), reusing the Coupon-Trade Service from Requirement 4.
- Unauthenticated users see a sign-in prompt instead of rows (Req 8.5), mirroring the existing rewards auth blocker.

### 9. Featured Rewards Rotator

**Files**

- `src/lib/featured.ts` (new): `// Deterministic per-period featured reward selection + countdown.`
- `src/routes/rewards/+page.server.ts` (extend): compute featured set + countdown at load.
- `src/routes/rewards/+page.svelte` (extend): featured section + day countdown; full catalog stays browsable.

**Pure rotator**

```ts
// Deterministic per-period featured reward selection + countdown.
export const ROTATION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_MS = ROTATION_DAYS * DAY_MS;
const FEATURED_COUNT = 3;

export function currentPeriodIndex(now: number): number {
	return Math.floor(now / PERIOD_MS);
}

// Whole days remaining until the next rotation (Req 9.5).
export function daysUntilNextRotation(now: number): number {
	const remainingMs = PERIOD_MS - (now % PERIOD_MS);
	return Math.max(1, Math.ceil(remainingMs / DAY_MS));
}

// Deterministic subset for a period: seed a small PRNG by the period index,
// shuffle a copy of the reward id list, take the first FEATURED_COUNT ids.
export function featuredRewardIds(ids: string[], now: number, count = FEATURED_COUNT): string[] {
	const seed = currentPeriodIndex(now);
	const order = seededShuffle([...ids], seed);
	return order.slice(0, Math.min(count, ids.length));
}
```

`seededShuffle` uses a `mulberry32`-style PRNG seeded solely by the period index, so the selection is stable for the whole period (Req 9.3), changes at the boundary (Req 9.4), and is reproducible across server instances (Req 9.1). The default cadence is 7 days (Req 9.2). The rewards page renders a "Featured this week" strip plus the countdown, while the existing full grid remains browsable (Req 9.6).

### 10. QA Sweep

**Files**

- `src/lib/server/menu-audit.ts` (new): `// Pure menu/submenu length auditing for the QA sweep.`
- `scripts/qa-sweep.ts` (new): `// Dev-only route sweep: records 500s and short menus into a report.`

**Menu audit (pure, testable)**

```ts
export type MenuDescriptor = { name: string; itemCount: number };
export type MenuFlag = { name: string; itemCount: number; reason: 'too-short' };
export const MIN_MENU_ITEMS = 2;

// Flags any menu/submenu with fewer than MIN_MENU_ITEMS items (Req 10.3).
export function flagShortMenus(menus: MenuDescriptor[]): MenuFlag[] {
	return menus
		.filter((menu) => menu.itemCount < MIN_MENU_ITEMS)
		.map((menu) => ({ name: menu.name, itemCount: menu.itemCount, reason: 'too-short' }));
}
```

**Sweep runner (`scripts/qa-sweep.ts`)** enumerates every navigable route (bottom-nav routes plus the new `rewards/history`, `rewards/partners`, and sub-modes), issues a `GET` against a locally running dev server, and records any route whose response status is 500 (Req 10.1, 10.2). It combines the 500 list with `flagShortMenus` output over a declared inventory of app menus/submenus, then prints a single report listing every recorded 500 and every flagged menu (Req 10.4). The runner is executed manually (`bun run scripts/qa-sweep.ts` against a running `bun run dev`), never in the request path.

## Data Models

### New: `partners`

| Column       | Type         | Notes                       |
| ------------ | ------------ | --------------------------- |
| `id`         | text PK      | uuid default                |
| `name`       | text notNull | shown on each pin           |
| `category`   | text notNull | vet / treat / toy / shelter |
| `address`    | text notNull | display only                |
| `map_x`      | int notNull  | 0..1000 normalized x        |
| `map_y`      | int notNull  | 0..1000 normalized y        |
| `created_at` | int notNull  | epoch ms                    |

Index: `partners_category_idx` on `category`.

### Extended: `reward_redemptions`

| New column   | Type            | Notes                  |
| ------------ | --------------- | ---------------------- |
| `used_at`    | int (nullable)  | set when status → used |
| `partner_id` | text (nullable) | redeeming partner id   |

`status` continues to default to `active`; the trade transition sets `status='used'`, `used_at`, and `partner_id` together.

### Extended: `Preferences` (cookie)

Adds `theme: 'light' | 'dark' | 'system'` (fifth colon-delimited segment; missing segment parses to `system`).

### Migrations

Two Drizzle migrations under `drizzle/`:

1. `create partners table` (+ category index) with a seed insert of demo partners.
2. `alter reward_redemptions add used_at, partner_id` (nullable, no backfill needed since existing rows remain `active`).

## Endpoints Summary

| Method | Path                     | Auth     | Rate limit               | Purpose                                      |
| ------ | ------------------------ | -------- | ------------------------ | -------------------------------------------- |
| POST   | `/api/preferences/theme` | any      | global `/api/*` IP limit | Persist theme preference to cookie (Req 1.5) |
| POST   | `/api/rewards/trade`     | required | per-user `coupon_trade`  | Trade an active coupon at a partner (Req 4)  |

Existing endpoints reused: `/api/shop/equip` (background selection, Req 2), `/api/rewards/redeem` (unchanged), `/api/vet/triage` (unchanged).

## Error Handling

| Condition                           | Response                                 |
| ----------------------------------- | ---------------------------------------- |
| Theme value not in allowlist        | Coerced to `system` (never errors)       |
| Trade: partner id unknown           | 400 "Choose a valid partner."            |
| Trade: redemption not owned by user | 403 authorization error (`// SECURITY:`) |
| Trade: redemption not `active`      | 409 conflict error                       |
| Trade: unauthenticated              | 401                                      |
| Trade: per-user rate exceeded       | 429 with `Retry-After`                   |
| Background: id not in catalog       | 400 (existing `equipItem`)               |
| Background: item not owned          | 403 (existing `equipItem`)               |
| History view: unauthenticated       | Sign-in prompt (no rows)                 |
| Partner map: no partners            | Empty-state card                         |
| Vet triage upstream failure         | Existing 502 handling, unchanged         |

All server errors return JSON `{ error }`; the trade and theme endpoints never leak stack traces. The QA sweep exists precisely to catch unexpected 500s across routes before demo.

## Testing Strategy

**Dual approach.** Pure logic modules (`theme.ts`, `coupon-trade.ts` transition logic, `featured.ts`, `menu-audit.ts`) are covered by property-based tests (min 100 iterations) plus targeted example/edge unit tests. DB-touching services (`tradeCoupon`, `listRedemptions`, `listPartners`) use in-memory LibSQL integration tests following the existing `*.spec.ts` pattern (see `inventory.spec.ts`, `gacha.spec.ts`). UI polish, the map mockup, and the mock booking flow use example-based component tests; they are not property-tested. The QA sweep runner is itself an integration tool, while its `flagShortMenus` core is property-tested.

Verification before handoff: `bun run check`, `bun test`, `bun run lint`.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Theme normalization is total and stable

_For any_ input value, `normalizeTheme` returns a member of `{light, dark, system}`, and _for any_ already-valid preference the result equals that preference (idempotent).

**Validates: Requirements 1.1**

### Property 2: Theme resolution honors preference and system scheme

_For any_ boolean `systemPrefersDark`: `resolveTheme('dark', x)` is `dark`; `resolveTheme('light', x)` is `light`; and `resolveTheme('system', x)` is `dark` if and only if `x` is true.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: Preferences round-trip preserves theme

_For any_ valid `Preferences` value, `parsePreferences(serializePreferences(p))` returns a value equal to `p`, including the persisted `theme` field.

**Validates: Requirements 1.5**

### Property 4: Backgrounds default to home when unset

_For any_ cat, resolving its scene background yields `bg_home` when `cats.backgroundId` is null and yields the stored id otherwise.

**Validates: Requirements 2.3**

### Property 5: Owned background selection persists

_For any_ background catalog id owned in the user's inventory and _any_ cat owned by that user, equipping the background and then reading the cat back yields that background id in `cats.backgroundId`.

**Validates: Requirements 2.2**

### Property 6: Invalid or unowned backgrounds are rejected without side effects

_For any_ id that is not a catalog background, equipping it is rejected and `cats.backgroundId` is unchanged; and _for any_ catalog background not present in the user's inventory, equipping it returns an authorization error and leaves `cats.backgroundId` unchanged.

**Validates: Requirements 2.4, 2.5**

### Property 7: Every partner renders as one named pin

_For any_ list of partners, the partner map renders exactly one location pin per partner and each partner's name appears in the rendered output.

**Validates: Requirements 3.2, 3.3**

### Property 8: Trading an active coupon marks it used and records the partner

_For any_ `active` reward redemption owned by the requesting user and _any_ valid partner, `tradeCoupon` transitions the redemption's status to `used` and records that partner's id on the redemption.

**Validates: Requirements 4.1, 4.2**

### Property 9: Only active coupons transition; repeats conflict

_For any_ reward redemption whose status is not `active`, `tradeCoupon` returns a conflict error and leaves the redemption unchanged; consequently, trading the same active redemption twice yields a used state on the first trade and a conflict error on the second.

**Validates: Requirements 4.3**

### Property 10: Coupons can only be traded by their owner

_For any_ reward redemption not belonging to the requesting user, `tradeCoupon` returns an authorization error and leaves the redemption's status unchanged.

**Validates: Requirements 4.4**

### Property 11: Labeled vet guidance parses into intro plus bullets

_For any_ vet reply composed of an optional non-bullet intro line followed by one or more `- Label:` guidance lines, `parseReply` returns those guidance lines as its points and the non-bullet line (if present) as its intro.

**Validates: Requirements 5.5**

### Property 12: Clinic cards expose name, specialty, and distance

_For any_ list of clinics, the vet directory render includes each clinic's name, specialty, and distance.

**Validates: Requirements 6.1**

### Property 13: History returns exactly the user's redemptions

_For any_ set of reward redemptions across multiple users, `listRedemptions(userId)` returns exactly the redemptions belonging to that user and none belonging to other users.

**Validates: Requirements 8.1**

### Property 14: History rows display title, code, and status

_For any_ list of redemption rows, the history view renders each row's reward title, code, and current status.

**Validates: Requirements 8.2**

### Property 15: Status styling and trade action track redemption status

_For any_ list of redemption rows, each `active` row is rendered with the active visual style and exposes a use/trade action, while each `used` row is rendered with the used visual style and exposes no trade action.

**Validates: Requirements 8.3, 8.4**

### Property 16: Featured selection is a deterministic subset per period

_For any_ list of reward ids and _any_ timestamp, `featuredRewardIds` returns a duplicate-free subset of those ids of size `min(count, length)`, and the selection depends only on `currentPeriodIndex(now)` — identical for any two timestamps within the same period and recomputed for a different period index.

**Validates: Requirements 9.1, 9.3, 9.4**

### Property 17: Rotation countdown is a whole number of days in range

_For any_ timestamp, `daysUntilNextRotation` returns a whole number of days in the inclusive range `[1, ROTATION_DAYS]`.

**Validates: Requirements 9.5**

### Property 18: Featured view never removes catalog items

_For any_ timestamp, the browsable reward catalog equals the full reward set; selecting a featured subset does not remove any reward from the catalog.

**Validates: Requirements 9.6**

### Property 19: Short menus are flagged exactly

_For any_ list of menu descriptors, `flagShortMenus` returns exactly the descriptors whose item count is below `MIN_MENU_ITEMS` (two), and no others.

**Validates: Requirements 10.3**
