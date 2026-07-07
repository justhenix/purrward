---
title: Gacha flow
description: Jar pull, point spend, roll, duplicate refund, and inventory write.
section: Flows
order: 3
---

<!-- Developer doc: jar and gacha flow. -->

# Gacha flow

```mermaid
flowchart LR
  A[Open jar] --> B[Check points]
  B --> C[Server rolls item]
  C --> D{Owned?}
  D -->|New| E[Add to inventory]
  D -->|Duplicate| F[Give refund]
  E --> G[Equip item]
  F --> G
```

Gacha cost, odds, duplicate refund, and selected item are server-owned.

Important files:

- `src/routes/api/gacha/pull/+server.ts`
- `src/lib/server/gacha.ts`
- `src/lib/server/catalog.ts`
- `src/lib/server/inventory.ts`
