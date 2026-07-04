# Purrward — Multi-Cat & Free Cat Mode Design

## Overview

This feature introduces a **Cat_Profile** entity between the user and their habit
completions. Today `habitCompletions` and `purrpoints` attach directly to a `users`
row and there is no cat concept. This design adds a `cats` table, an `activeCatId`
pointer, and a `catId` foreign key on completions, then threads the active cat through
the verification pipeline so that each cat accumulates its own care history and points
attribution.

Two connected capabilities are delivered:

1. **Multiple cats** — an owner registers up to a `Cat_Cap` of cats, switches the
   active cat, and sees per-cat care history and points.
2. **Free cat mode** — a user with no owned pet onboards by creating a `community`
   cat (street/community care) and participates in the same care-to-earn loop.

The redeemable Purrpoints balance stays server-authoritative on `users.purrpoints`
(consumed by `rewards.ts::redeemReward`) and is maintained as the exact sum of
per-cat attributions. No client-supplied cat id or points value is ever trusted; all
validation happens at the Worker boundary.

### Scope alignment

MVP-focused. Reuses the existing Gemini verification pipeline, avatar set
(`CAT_AVATAR_IDS`), preferences cookie, and session model unchanged. No new external
services. Sandbox mode behavior is preserved (cat-agnostic, cookie-backed).

## Architecture

```
Client (SvelteKit 5 SSR/CSR, runes only)
    ↓ HTTPS only — untrusted
Cloudflare Worker (validation boundary)
    │
    ├── Cat_Manager  (src/lib/server/cats.ts)      create/list/update/remove/select
    ├── Onboarding_Service (reuses Cat_Manager)    first-cat + free-cat path
    ├── Verification_Service (photo-verification.ts) now cat-scoped
    │        ↓ sandboxed prompt
    │      Gemini API
    └── Points_Ledger (users.purrpoints + cats.purrpoints, transactional)
    ↓ parameterized Drizzle queries
  Turso / LibSQL
```

Request flow for a cat-scoped habit:

```
select active cat → care page (owned vs community habit set)
  → photo upload → MIME/size validation → EXIF strip
  → ownership check (catId belongs to user) → Gemini verify
  → per-cat daily cap check → atomic award (users += n, cats += n)
```

The Active_Cat is resolved server-side on every protected request (via
`+layout.server.ts`) so the dashboard and care flow always operate in a known cat
context, persisted across sessions.

## Components and Interfaces

### Cat_Manager — `src/lib/server/cats.ts` (new)

Owner-scoped, server-validated operations. All queries filter by `userId` from
`locals.user`; a client-supplied cat id is only ever used inside a `WHERE
cats.id = ? AND cats.userId = ?` predicate, never trusted on its own.

```ts
export const CAT_CAP = 10; // Cat_Cap: max cats per user (owned + community combined)
export const CAT_NAME_MAX = 40;

export type CareMode = 'owned' | 'community';

export type CatProfile = {
  id: string;
  name: string;
  careMode: CareMode;
  avatarId: CatAvatarId;
  purrpoints: number;
  createdAt: number;
};

// Result union mirrors rewards.ts style: discriminated on `ok`.
type CatResult<T> = { ok: true; value: T } | { ok: false; status: number; error: string; field?: 'name' | 'avatar' };

createCat(db, userId, { name, avatarId, careMode }): Promise<CatResult<CatProfile>>
listCats(db, userId): Promise<CatProfile[]>                 // oldest → newest
getCat(db, userId, catId): Promise<CatProfile | null>       // owner-scoped
updateCat(db, userId, catId, { name?, avatarId? }): Promise<CatResult<CatProfile>>
removeCat(db, userId, catId): Promise<CatResult<{ activeCatId: string | null }>>
selectActiveCat(db, userId, catId): Promise<CatResult<{ activeCatId: string }>>
```

Validation rules (server-side, applied before any write):

- `name`: trim; reject if empty or > `CAT_NAME_MAX` → `field: 'name'`.
- `avatarId`: must satisfy `isCatAvatarId` → else `field: 'avatar'`.
- `createCat`: reject when `count(cats where userId) >= CAT_CAP` (status 409).
- First created cat is set as `activeCatId`.

`removeCat` runs in a transaction: delete the cat's `habitCompletions`, delete the
cat row, and if it was the active cat, re-point `activeCatId` to the most recently
created remaining cat, or `null` if none remain. `users.purrpoints` is **not**
decremented on removal per Requirement 4.5 (the balance the user already earned is
retained), which means the sum invariant is deliberately relaxed to `users.purrpoints

> = SUM(cats.purrpoints)` after a removal — see Data Model note below.

### Onboarding_Service

Not a separate file; a thin flow implemented in the onboarding route action that calls
`Cat_Manager.createCat`. For free cat mode with no supplied name it generates a default
community name (e.g. `Community Cat`, or a small curated list) of 1–40 chars before
delegating to `createCat` with `careMode: 'community'`. On creation failure it leaves
`activeCatId` unset and preserves the free-cat selection so the user can retry.

### Verification_Service — `src/lib/server/photo-verification.ts` (modified)

`verifyCarePhoto` gains a required `catId` (read from `FormData`, never from a body the
client can spoof beyond the ownership check). New behavior:

- Resolve and authorize the cat: `getCat(db, userId, catId)`; if missing → reject
  `403` "This cat is not available." (Req 5.6 / 6.6) with no completion recorded.
- If no active/selected cat is supplied at all → `400` "Select an active cat." (Req 5.2).
- Daily caps are keyed per-cat (see below).
- Award attributes points to **both** `users.purrpoints` and `cats.purrpoints` in the
  same transaction.
- `buildGeminiVerificationRequest` is extended with community task labels; the prompt
  stays server-owned and immutable.

### Habit set selection

`security.ts` gains a `COMMUNITY_TASK_TYPES` set and a helper to pick the habit set by
care mode:

```ts
// Owned cats keep the existing set.
const OWNED_TASK_TYPES = ['feeding','water','litter','play','grooming','meds'];
// Community_Habit_Set — reuses the verification pipeline with community-appropriate labels.
const COMMUNITY_TASK_TYPES = ['street_feeding','water','shelter_care'];
habitSetFor(careMode): readonly TaskType[]
validateTaskType(value, careMode): TaskType | null   // now care-mode aware
```

`street_feeding` and `shelter_care` are added to `TaskType` and to the Gemini
`taskLabels` map (e.g. "street or community cat feeding", "shelter or outdoor shelter
care"). `water` is shared across both modes.

### Routes / UI (Svelte 5 runes only)

- `src/routes/cats/+page.svelte` + `+page.server.ts` — cat list, create/edit/remove
  (form actions calling Cat_Manager). Each new file gets a 1-line header comment.
- `src/routes/onboarding/+page.svelte` + `+page.server.ts` — first-cat choice
  (owned vs free cat mode).
- Dashboard cat switcher component `src/lib/components/CatSwitcher.svelte` — posts to a
  `selectActiveCat` action.
- `+layout.server.ts` extended to load the user's cats + active cat so the switcher and
  care page render in the active-cat context.
- Care page (`care/+page.server.ts`) scoped to the active cat's completions and habit
  set. If the active cat's habit data fails to load, the dashboard still renders with a
  "habit tracking temporarily unavailable" message (Req 3.8).

All UI uses `layout.css` design tokens, Quicksand/Inter fonts, cozy feline aesthetic;
no monospace, no hardcoded colors.

## Data Models

### `cats` table (new — Cat_Profile)

```ts
export const cats = sqliteTable(
	'cats',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()), // server-generated
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		name: text('name').notNull(),
		careMode: text('care_mode').notNull(), // 'owned' | 'community'
		avatarId: text('avatar_id').notNull(),
		purrpoints: integer('purrpoints').notNull().default(0), // per-cat attribution
		createdAt: integer('created_at').notNull()
	},
	(table) => [
		index('cats_user_idx').on(table.userId),
		index('cats_user_created_idx').on(table.userId, table.createdAt) // Req 2.3 ordering
	]
);
```

### `users` table (modified)

Add a nullable `activeCatId` pointer:

```ts
activeCatId: text('active_cat_id').references(() => cats.id); // Active_Cat, persists across sessions
```

`purrpoints` remains the server-authoritative redeemable balance used by
`rewards.ts`.

**Where does Active_Cat live? (decision)** — On `users`, not in the session row or the
preferences cookie. Rationale: Requirement 3.7 requires the active cat to persist
across sessions; the session row is recreated on each login and the preferences cookie
is client-held (mutable, and we never trust client state for authorization). A column
on `users` is durable, server-owned, and joins cheaply in the layout load. Tradeoff: a
nullable self-referential-ish FK (`users → cats`, while `cats → users`) creates a mutual
reference; we accept it because SQLite FKs are deferrable/non-blocking here and
`removeCat` always fixes up `activeCatId` inside the same transaction as the delete.

### `habitCompletions` table (modified)

Add nullable `catId` for backward compatibility with existing rows, plus per-cat cap
indexes:

```ts
catId: (text('cat_id').references(() => cats.id), // nullable for pre-existing rows; backfilled
	// new indexes
	index('habit_completions_cat_created_idx').on(table.catId, table.createdAt), // Req 5.3 history
	index('habit_completions_user_cat_task_day_idx').on(
		table.userId,
		table.catId,
		table.taskType,
		table.dayStart
	)); // Req 5.5 per-cat cap
```

`catId` is nullable only to permit a safe migration; after backfill (below) all rows
have a `catId`, and new writes always set it.

### Points_Ledger invariant

**Invariant:** for every user, `users.purrpoints == SUM(cats.purrpoints WHERE userId)`
while no cat has been removed. After a `removeCat`, the invariant relaxes to
`users.purrpoints >= SUM(cats.purrpoints WHERE userId)` because Requirement 4.5 keeps
the user's earned balance even though the removed cat's attribution disappears.

**Maintenance strategy** — the invariant is preserved by only ever mutating the two
counters together inside a single Drizzle transaction:

```
// SECURITY: points are server-computed; both counters move atomically.
tx {
  insert habitCompletions { userId, catId, ... , pointsAwarded }
  if (pointsAwarded > 0) {
    update users set purrpoints = purrpoints + n where id = userId
    update cats  set purrpoints = purrpoints + n where id = catId and userId = userId
  }
}
```

Because the existing `recordVerification` is already a single atomic transaction, the
award to `users` and `cats` cannot diverge — there is no window where one is written
without the other.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid
executions of a system — a formal statement about what the system should do. Properties
bridge human-readable requirements and machine-verifiable correctness guarantees._

These properties are the result of the prework analysis and its redundancy reflection.
Care mode (`owned` vs `community`) is folded into generators rather than duplicated per
property, so requirements 8.4, 8.6, 9.1–9.4 are validated by the properties below when
exercised with mixed-mode inputs.

### Property 1: Valid creation stores a well-formed cat

_For any_ user under the cap and any valid input (name 1–40 chars after trimming, avatar
in `CAT_AVATAR_IDS`, care mode `owned` or `community`), creating a cat yields a stored
Cat_Profile whose trimmed name, avatar, and care mode match the input, with a
server-generated id and the user's cat count increased by exactly one.

**Validates: Requirements 1.1, 7.4**

### Property 2: Cat ids are unique and server-generated

_For any_ sequence of cat creations, every resulting Cat_Profile has a distinct
server-generated identifier.

**Validates: Requirements 1.6**

### Property 3: Name and avatar validation rejects invalid input without side effects

_For any_ create or update request whose name is empty/whitespace-only or longer than 40
characters, or whose avatar is not in `CAT_AVATAR_IDS`, the request is rejected with a
field-identifying error and no cat is created or modified.

**Validates: Requirements 1.4, 1.5, 4.2, 7.5**

### Property 4: The cap bounds the combined cat count

_For any_ user holding fewer than `CAT_CAP` cats a creation succeeds, and _for any_ user
holding exactly `CAT_CAP` cats (any mix of owned and community) a creation is rejected
with the cap message and the existing cat list is left unchanged.

**Validates: Requirements 1.2, 1.3, 9.4, 7.7**

### Property 5: Cat lists are owner-isolated, complete, and ordered

_For any_ set of users each with created cats, listing a user's cats returns exactly
that user's cats (no other user's cats), each including name, care mode, avatar, and
attributed purrpoints, ordered by creation time oldest to newest.

**Validates: Requirements 2.1, 2.2, 2.3, 9.1**

### Property 6: Active-cat selection is authorized and persistent

_For any_ user, selecting one of their own cats records it as the Active_Cat and that
value is restored on a subsequent fresh load; selecting a cat id not belonging to the
user is rejected and leaves the current Active_Cat unchanged. Creating the first cat
sets it active, and removing the active cat re-points to the most recently created
remaining cat or clears it when none remain.

**Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.6, 3.7**

### Property 7: Habit completions are cat-scoped, filtered, and ordered

_For any_ verified habit completed while a cat is active, the recorded completion is
associated with that cat and carries a timestamp; and _for any_ cat, its care history
returns exactly the completions associated with that cat, ordered most recent to oldest.

**Validates: Requirements 5.1, 5.3**

### Property 8: A habit requires an active cat

_For any_ habit submission made with no active/selected cat, the request is rejected and
no Habit_Completion is recorded.

**Validates: Requirements 5.2**

### Property 9: Foreign or invalid cats are rejected with no side effects

_For any_ habit or verification request referencing a cat id that does not exist or does
not belong to the requesting user, the request is rejected with an authorization/invalid
-cat error, no Habit_Completion is recorded, and the user's balance is unchanged.

**Validates: Requirements 5.6, 6.6, 4.4**

### Property 10: Daily per-task cap is independent per cat

_For any_ user with two or more cats, reaching the daily verified-task cap for one cat
and task type does not reduce the points still earnable for the same task type on any
other cat.

**Validates: Requirements 5.5, 8.6**

### Property 11: Balance equals the sum of per-cat attributions

_For any_ sequence of confirmed habit awards across a user's cats (with no cat removal),
each award adds the same server-computed amount to both `users.purrpoints` and the
target cat's `purrpoints`, and afterward `users.purrpoints` equals the sum of that
user's per-cat attributions.

**Validates: Requirements 6.1, 6.4, 8.4**

### Property 12: Points are server-authoritative

_For any_ client-supplied points or per-cat attribution value included in a submission,
the awarded amount is the server-computed value and the client value has no effect on
either counter.

**Validates: Requirements 6.5**

### Property 13: Unconfirmed habits award nothing

_For any_ habit whose verification result is not confirmed (rejected or verification
failure), no points are added to the user or the cat and an error indication is
returned.

**Validates: Requirements 8.5**

### Property 14: Upload validation gates the award

_For any_ upload that is not an accepted image type or exceeds 5MB, the submission is
rejected before verification, no points are awarded, and the habit state is preserved.

**Validates: Requirements 8.3**

### Property 15: Habit set matches care mode

_For any_ cat, the offered habit set is the owned-cat set when its care mode is `owned`
and the Community_Habit_Set when its care mode is `community`.

**Validates: Requirements 8.1, 9.2, 9.3**

### Property 16: Free cat mode creates an active community cat

_For any_ free-cat onboarding, the created cat has care mode `community` and becomes the
Active_Cat; when no name is supplied the generated community name is between 1 and 40
characters.

**Validates: Requirements 7.2, 7.3**

### Property 17: Confirmed awards are recorded exactly once

_For any_ confirmed habit, the awarded points are recorded exactly once even if the
award write is retried, so no duplicate credit is applied to the user or the cat.

**Validates: Requirements 8.7**

## Error Handling

All handlers return a discriminated result (`{ ok: false, status, error, field? }`)
translated to JSON responses at the route boundary, mirroring `rewards.ts`.

| Condition                       | Status               | Behavior                                                                                           |
| ------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| Unauthenticated request         | 401                  | No cat data returned (Req 2.5)                                                                     |
| Invalid name / avatar           | 400                  | `field` set to `name`/`avatar`, no write (Req 1.4, 1.5, 4.2)                                       |
| Cap reached                     | 409                  | Existing cats unchanged, cap message (Req 1.3)                                                     |
| Foreign / missing cat id        | 403                  | No completion, balance unchanged (Req 3.3, 4.4, 5.6, 6.6)                                          |
| No active cat on habit submit   | 400                  | No completion recorded (Req 5.2)                                                                   |
| Upload invalid (type/size)      | 400                  | No verification, no award, state preserved (Req 8.3)                                               |
| Gemini unavailable / unverified | 502 / 200 unverified | Records unverified completion, no points (Req 8.5)                                                 |
| Cat list data-store failure     | 500                  | No partial list (Req 2.6)                                                                          |
| Active-cat habit load failure   | dashboard 200        | Dashboard renders with "temporarily unavailable" (Req 3.8)                                         |
| Award write fails post-confirm  | retry then pending   | Retry up to 5 attempts ≥5s apart; then persist confirmed-but-unpaid + pending error (Req 8.7, 8.8) |

**Award retry / exactly-once (Req 8.7, 8.8):** because `recordVerification` already
performs the completion insert and both point increments in one atomic transaction, the
common case is exactly-once by construction — either the whole award commits or nothing
does. The retry policy only matters if the award write is ever decoupled from the
verification record. The pragmatic MVP approach: keep the award inside the atomic
transaction (no partial credit possible); on transaction failure, retry the whole unit
up to 5 attempts at ≥5s intervals. If all attempts fail, insert/keep the completion row
in a confirmed-but-unpaid state (`verified = 1`, `pointsAwarded = 0`) and surface a
"points pending" indication for later reconciliation. Idempotency is anchored on the
completion row so a reconciliation pass credits each confirmed-unpaid row exactly once.

## Migration & Backfill Plan

Existing users have `purrpoints` and `habitCompletions` but no cat. A drizzle-kit
migration in `drizzle/` performs:

1. **Schema:** create `cats`; add `users.active_cat_id` (nullable); add
   `habit_completions.cat_id` (nullable) and the two new indexes.
2. **Backfill default cats:** for every existing user, insert one `owned` cat named e.g.
   `"My Cat"` with a default avatar (`orange`), `purrpoints = users.purrpoints`,
   `createdAt = users.createdAt`.
3. **Assign the active cat:** set each user's `active_cat_id` to their backfilled cat.
4. **Reassign completions:** set `habit_completions.cat_id` to that user's backfilled
   cat for all of the user's existing rows.
5. **Invariant check (verification step):** after backfill,
   `users.purrpoints == SUM(cats.purrpoints)` holds for every user because each user has
   exactly one cat carrying the full balance.

`cat_id` stays nullable at the column level to keep the migration non-blocking, but
application writes always set it. A follow-up migration may tighten it to `NOT NULL`
once all rows are backfilled.

## Testing Strategy

PBT applies here: the Cat_Manager, per-cat cap logic, and points attribution are pure-ish
data transformations over a mockable database with strong universal invariants (balance
sum, isolation, ordering, validation). UI routing and the live Gemini call are covered by
example/integration tests instead.

**Property-based tests** — use `fast-check` with Vitest, minimum 100 iterations per
property, each tagged `// Feature: multi-cat-and-free-cat-mode, Property {n}: {text}`.
Implement each of Properties 1–17 as a single property test, driven by generators for
users, cats (mixed `owned`/`community`), valid/invalid names, avatars, task types, and
award sequences, against an in-memory/mocked Drizzle database. The balance sum invariant
(Property 11) and per-cat cap independence (Property 10) are the highest-value targets.

**Unit / example tests** — auth gating (2.5), data-store failure (2.6), dashboard
degradation (3.8), onboarding choice rendering (7.1), creation-failure path (7.6),
zero-point display (6.3), empty-list/empty-history edge cases (2.4, 5.4), and the
confirmed-but-unpaid reconciliation path (8.8).

**Integration tests** — 1–2 examples with a mocked Gemini fetcher asserting the
server-owned prompt is used for community task labels and that a verification result is
returned (8.2). Preserve existing sandbox-mode tests unchanged.

## Key Technical Decisions

- **Active_Cat on `users`, not session/cookie** — durable across sessions (Req 3.7),
  server-owned, never trusted from the client.
- **Atomic dual-counter award** — `users.purrpoints` and `cats.purrpoints` move together
  in one transaction, making the balance invariant hold by construction (Property 11).
- **Balance retained on removal** — per Req 4.5 the user keeps earned points; the sum
  invariant intentionally relaxes to `>=` after a removal.
- **`catId` nullable then backfilled** — enables a safe, non-blocking migration for
  existing rows.
- **Community_Habit_Set reuses the pipeline** — `street_feeding`, `water`,
  `shelter_care` reuse the same validation, EXIF stripping, and server-owned Gemini
  prompt; no separate verification path.
- **Upload types discrepancy (flagged)** — Requirement 8.3 lists `webp`, but current
  `validateUpload` accepts only `image/jpeg` and `image/png`. This design keeps the
  implemented `jpeg/png` set to match current behavior; extending to `webp` is a small,
  optional one-line change to `ALLOWED_MIMES` (plus a webp branch in
  `stripImageMetadata`) and can be scoped separately.
