---
title: Reward flow
description: Reward redemption and server-owned point deduction.
section: Flows
order: 2
---

<!-- Developer doc: reward redemption flow. -->

# Reward flow

```mermaid
flowchart LR
  A[Earn points] --> B[Open Rewards]
  B --> C[Choose reward or cosmetic]
  C --> D[Server checks balance]
  D --> E{Enough?}
  E -->|Yes| F[Deduct points]
  F --> G[Create code or inventory item]
  E -->|No| H[Show not enough points]
```

Reward codes are generated server-side. Direct cosmetic purchases write to account-wide inventory.

Important files:

- `src/lib/server/rewards.ts`
- `src/lib/server/purchase.ts`
- `src/lib/server/coupon-trade.ts`
- `src/lib/server/catalog.ts`
