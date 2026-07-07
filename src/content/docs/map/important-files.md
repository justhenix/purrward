---
title: Important files
description: Practical file map for app routes, APIs, and server logic.
section: Map
order: 1
---

<!-- Developer doc: important Purrward files and purposes. -->

# Important files

Files most likely to inspect during demo polish or feature work.

| Path                                   | Purpose                                                        |
| -------------------------------------- | -------------------------------------------------------------- |
| `src/routes/+layout.svelte`            | App shell, bottom nav, docs shell escape, global sync toast.   |
| `src/routes/layout.css`                | Design tokens, theme colors, surfaces, typography.             |
| `src/routes/+page.svelte`              | Homepage care scene and primary loop.                          |
| `src/routes/onboarding/`               | First-run avatar and account setup.                            |
| `src/routes/care/`                     | Daily care task list.                                          |
| `src/routes/care-proof/`               | Photo proof upload flow.                                       |
| `src/routes/rewards/`                  | Rewards, coupons, cosmetics, and jar UI.                       |
| `src/routes/vet/`                      | AI Vet chat and mock visit help.                               |
| `src/routes/profile/`                  | Profile, settings, reminders, privacy, and help.               |
| `src/routes/cats/`                     | Cat profiles and equipped items.                               |
| `src/routes/api/verify/`               | Care proof API boundary.                                       |
| `src/routes/api/rewards/redeem/`       | Reward code redemption API.                                    |
| `src/routes/api/rewards/trade/`        | Coupon partner trade API.                                      |
| `src/routes/api/shop/purchase/`        | Direct cosmetic purchase API.                                  |
| `src/routes/api/gacha/pull/`           | Jar pull API.                                                  |
| `src/routes/api/vet/triage/`           | AI Vet triage API.                                             |
| `src/lib/server/auth.ts`               | Session and user auth helpers.                                 |
| `src/lib/server/db/schema.ts`          | Drizzle schema for users, cats, points, inventory, rewards.    |
| `src/lib/server/photo-verification.ts` | Server-owned proof verification and point award logic.         |
| `src/lib/server/vet-triage.ts`         | Server-owned AI Vet prompt and response cleanup.               |
| `src/lib/server/catalog.ts`            | Rewards, cosmetics, backgrounds, costs, and gacha eligibility. |
| `src/lib/server/gacha.ts`              | Server-owned jar roll, duplicate refund, and inventory write.  |
| `src/lib/server/security.ts`           | Input cleanup, upload validation, metadata stripping.          |
| `src/lib/assets/`                      | Bundled app art.                                               |
| `static/`                              | Public icons, manifest, robots file.                           |
| `drizzle/`                             | Database migrations and snapshots.                             |
