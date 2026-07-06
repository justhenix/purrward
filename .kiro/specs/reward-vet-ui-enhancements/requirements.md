# Requirements Document

## Introduction

This feature bundles a set of UI and product enhancements for Purrward, the care-to-earn cat wellness PWA. It covers an app-wide light/dark theme (night mode), per-cat scene backgrounds, a partner directory rendered on a map mockup with a coupon-trade flow, a polished medical-chat-style AI vet experience, an in-app clinic/vet directory with a mock booking flow, a reduction of AI triage suggestion chips to exactly three, a reward history and claimed-rewards view tied to redemption status, rotating featured rewards on a fixed cadence, and a quality-assurance sweep of all pages and menus.

All work extends the existing MVP and honors Purrward's steering constraints: Svelte 5 runes only, TypeScript strict (no `any`), one-line file header comments, `layout.css` design tokens for all colors, server-owned points and redemption codes, Drizzle query builders (never string interpolation), rate-limited protected endpoints, and `// SECURITY:` comments on security-critical code. Rewards are coupons, never real food or goods.

## Glossary

- **Theme_Manager**: The subsystem that resolves, applies, and persists the active color theme (light or dark) across the app.
- **Theme_Preference**: A user-selectable value of `light`, `dark`, or `system` persisted through the existing Purrward preferences mechanism that also stores `sandboxMode`.
- **Dark_Theme_Tokens**: The `--color-dark-*` design tokens defined in `src/routes/layout.css` that supply dark-mode color values.
- **Background_Catalog**: The set of per-cat scene background catalog entries of `kind` `background` defined in `src/lib/server/catalog.ts`.
- **Cat_Background**: The `cats.backgroundId` field selecting a scene background for a specific cat, defaulting to `bg_home` when null.
- **Partner_Directory**: The subsystem that stores and lists partner businesses from the new `partners` database table.
- **Partner_Map**: The map mockup view that displays Partner_Directory entries as locations.
- **Coupon_Trade_Service**: The server-owned service that transitions a `reward_redemptions` row from `active` to a used state and records the redeeming partner.
- **Reward_Redemption**: A row in the `reward_redemptions` table representing a redeemed coupon with a server-generated code and a status.
- **Vet_Chat_UI**: The AI vet chat interface under the "Talk to AI" mode at `src/routes/vet/+page.svelte`.
- **Triage_Suggestions**: The list of suggestion chips shown in the empty Vet_Chat_UI state.
- **Vet_Directory**: The clinic/vet directory shown under the "Vet visit help" mode.
- **Booking_Flow**: The mock appointment-booking interaction launched from a Vet_Directory clinic card.
- **Reward_History_View**: The interface listing a user's past Reward_Redemption rows and their current status.
- **Featured_Rewards_Rotator**: The subsystem that selects a rotating subset of catalog rewards on a fixed cadence and reports the time until the next rotation.
- **Rotation_Cadence**: The fixed interval, defaulting to 7 days, on which Featured_Rewards_Rotator refreshes its selection.
- **QA_Sweep**: The verification activity that checks all pages, menus, and submenus for internal server errors and flags awkward or too-short menu content.
- **User**: An authenticated Purrward account holder with a session.

## Requirements

### Requirement 1: App-wide light/dark theme toggle

**User Story:** As a cat owner, I want a night-mode toggle, so that I can use Purrward comfortably in low light.

#### Acceptance Criteria

1. THE Theme_Manager SHALL support exactly three Theme_Preference values: `light`, `dark`, and `system`.
2. WHERE Theme_Preference is `dark`, THE Theme_Manager SHALL apply Dark_Theme_Tokens across all app routes.
3. WHERE Theme_Preference is `light`, THE Theme_Manager SHALL apply the default light design tokens across all app routes.
4. WHERE Theme_Preference is `system`, THE Theme_Manager SHALL apply Dark_Theme_Tokens WHILE the operating system reports a `prefers-color-scheme` value of `dark`, and apply the default light design tokens otherwise.
5. WHEN a User selects a Theme_Preference value, THE Theme_Manager SHALL persist that value through the same preferences mechanism that stores `sandboxMode`.
6. WHEN a User loads any app route in a session with a persisted Theme_Preference, THE Theme_Manager SHALL apply the persisted Theme_Preference before first paint.
7. THE Theme_Manager SHALL define Dark_Theme_Tokens as `--color-dark-*` tokens in `src/routes/layout.css`.

### Requirement 2: Per-cat scene backgrounds

**User Story:** As a cat owner, I want to choose a scene background for each cat, so that each cat's space feels personal.

#### Acceptance Criteria

1. THE Background_Catalog SHALL provide two or more scene backgrounds of `kind` `background` beyond `bg_home` in `src/lib/server/catalog.ts`.
2. WHEN a User selects a Cat_Background for a specific cat from the Background_Catalog, THE System SHALL persist the selected background id to that cat's `cats.backgroundId` field using a Drizzle query builder.
3. WHILE a cat's `cats.backgroundId` is null, THE System SHALL render that cat with the `bg_home` background.
4. IF a User submits a background id that is not present in the Background_Catalog, THEN THE System SHALL reject the selection and leave `cats.backgroundId` unchanged.
5. IF a User attempts to assign a background not owned in that User's inventory, THEN THE System SHALL reject the selection and return an authorization error.

### Requirement 3: Partner directory and map mockup

**User Story:** As a cat owner, I want to see partner locations on a map, so that I know where I can use my coupons.

#### Acceptance Criteria

1. THE System SHALL define a `partners` table in the Drizzle schema at `src/lib/server/db/schema.ts` with at least a partner id, name, and location fields.
2. WHEN a User opens the Partner_Map, THE Partner_Directory SHALL render each stored partner as a location on the map mockup.
3. THE Partner_Directory SHALL display each partner's name for every rendered partner location.
4. IF the Partner_Directory contains no partners, THEN THE Partner_Map SHALL display an empty-state message.

### Requirement 4: Trade coupon at partner

**User Story:** As a cat owner, I want to trade a coupon at a partner, so that I can claim the reward the coupon represents.

#### Acceptance Criteria

1. WHEN a User trades an `active` Reward_Redemption at a selected partner, THE Coupon_Trade_Service SHALL transition that Reward_Redemption's status from `active` to `used` using a Drizzle query builder.
2. WHEN the Coupon_Trade_Service marks a Reward_Redemption as `used`, THE Coupon_Trade_Service SHALL record the redeeming partner's id on that Reward_Redemption.
3. IF a User attempts to trade a Reward_Redemption whose status is not `active`, THEN THE Coupon_Trade_Service SHALL reject the trade and return a conflict error.
4. IF a User attempts to trade a Reward_Redemption that does not belong to that User, THEN THE Coupon_Trade_Service SHALL reject the trade and return an authorization error.
5. THE Coupon_Trade_Service SHALL present each reward as a coupon and SHALL exclude any claim that dispenses physical food or goods directly.
6. WHEN a User submits a coupon-trade request, THE System SHALL apply per-user rate limiting to the trade endpoint.

### Requirement 5: Polished medical-chat AI vet UI

**User Story:** As a worried cat owner, I want the AI vet chat to feel like a clean medical-chat product, so that I trust and enjoy using it.

#### Acceptance Criteria

1. THE Vet_Chat_UI SHALL render user messages and vet replies as distinct conversation bubbles using `layout.css` design tokens for all colors.
2. WHILE the Vet_Chat_UI is awaiting an AI reply, THE Vet_Chat_UI SHALL display a typing indicator.
3. WHEN a new message is added to the conversation, THE Vet_Chat_UI SHALL scroll the newest message into view.
4. THE Vet_Chat_UI SHALL display a triage-only disclaimer stating the chat does not replace a licensed vet.
5. WHERE a vet reply contains labeled guidance lines, THE Vet_Chat_UI SHALL render those lines as scannable bullet points.

### Requirement 6: Clinic and vet directory with mock booking

**User Story:** As a cat owner, I want a directory of clinics with a booking option, so that I can arrange in-person vet care.

#### Acceptance Criteria

1. WHEN a User selects the "Vet visit help" mode, THE Vet_Directory SHALL display clinic cards, each showing a clinic name, a specialty, and a distance.
2. THE Vet_Directory SHALL display a consult or book action control on each clinic card.
3. WHEN a User activates the book action on a clinic card, THE Booking_Flow SHALL present a mock booking interaction for that clinic.
4. WHEN a User completes the mock Booking_Flow, THE Booking_Flow SHALL display a booking confirmation for the selected clinic.

### Requirement 7: Exactly three AI triage suggestion chips

**User Story:** As a cat owner, I want a focused set of suggestion chips, so that starting a triage question is quick and uncluttered.

#### Acceptance Criteria

1. WHILE the Vet_Chat_UI is in its empty state, THE Triage_Suggestions SHALL display exactly three suggestion chips.
2. WHEN a User selects a Triage_Suggestions chip, THE Vet_Chat_UI SHALL start a triage question from that chip's prompt.

### Requirement 8: Reward history and claimed rewards view

**User Story:** As a cat owner, I want to see my reward history and claimed rewards, so that I can track and use the coupons I have earned.

#### Acceptance Criteria

1. WHEN a User opens the Reward_History_View, THE System SHALL list that User's Reward_Redemption rows retrieved with a Drizzle query builder.
2. THE Reward_History_View SHALL display each Reward_Redemption's reward title, code, and current status.
3. THE Reward_History_View SHALL visually distinguish Reward_Redemption rows with status `active` from rows with status `used`.
4. WHERE a Reward_Redemption has status `active`, THE Reward_History_View SHALL present a use or trade action that initiates the Coupon_Trade_Service flow described in Requirement 4.
5. IF a User is not authenticated, THEN THE Reward_History_View SHALL display a sign-in prompt instead of redemption rows.

### Requirement 9: Rotating featured rewards with countdown

**User Story:** As a cat owner, I want featured rewards that rotate on a schedule, so that the store feels fresh while I can still browse everything.

#### Acceptance Criteria

1. THE Featured_Rewards_Rotator SHALL select a subset of catalog rewards as featured for the current Rotation_Cadence period.
2. THE Featured_Rewards_Rotator SHALL use a default Rotation_Cadence of 7 days.
3. WHILE a Rotation_Cadence period is active, THE Featured_Rewards_Rotator SHALL keep the same featured selection for the duration of that period.
4. WHEN the current Rotation_Cadence period ends, THE Featured_Rewards_Rotator SHALL select the next featured subset.
5. THE Featured_Rewards_Rotator SHALL display a countdown stating the number of whole days until the next featured rotation.
6. THE System SHALL keep the full reward catalog browsable regardless of the current featured selection.

### Requirement 10: QA sweep of pages and menus

**User Story:** As a maintainer, I want a sweep of all pages and menus, so that internal errors and awkward navigation are found before demo.

#### Acceptance Criteria

1. WHEN the QA_Sweep runs, THE QA_Sweep SHALL visit every app route, menu, and submenu reachable from the navigation.
2. IF a visited route returns an internal server error response with status 500, THEN THE QA_Sweep SHALL record that route and its error.
3. WHEN the QA_Sweep evaluates a menu or submenu, THE QA_Sweep SHALL flag any menu or submenu whose item count is below two as awkward or too short.
4. WHEN the QA_Sweep completes, THE QA_Sweep SHALL produce a report listing every recorded 500 error and every flagged menu or submenu.
