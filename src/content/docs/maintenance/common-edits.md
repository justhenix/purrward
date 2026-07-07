---
title: Common edits
description: Short path map for frequent demo polish and product changes.
section: Maintenance
order: 1
---

<!-- Developer doc: common edit paths for Purrward. -->

# Common edits

| Change                                | File                                                  |
| ------------------------------------- | ----------------------------------------------------- |
| Colors or theme tokens                | `src/routes/layout.css`                               |
| Homepage scene composition            | `src/routes/+page.svelte`                             |
| Homepage pet scene behavior           | `src/lib/home/PetScene.svelte`                        |
| Care tasks                            | `src/lib/tasks.ts`                                    |
| Rewards, cosmetics, costs, gacha pool | `src/lib/server/catalog.ts`                           |
| AI proof verification prompt          | `src/lib/server/photo-verification.ts`                |
| AI Vet prompt and reply cleanup       | `src/lib/server/vet-triage.ts`                        |
| App art                               | `src/lib/assets/`, then catalog or import mapping     |
| OAuth flow                            | `src/lib/server/google-oauth.ts`, `src/routes/auth/`  |
| DB schema                             | `src/lib/server/db/schema.ts`, then Drizzle migration |
