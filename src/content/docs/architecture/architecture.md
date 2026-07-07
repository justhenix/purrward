---
title: Architecture
description: Main SvelteKit, API, Gemini, database, points, rewards, and inventory flow.
section: Architecture
order: 1
---

<!-- Developer doc: Purrward architecture diagram. -->

# Architecture

Purrward runs as a SvelteKit app on Cloudflare. Server routes own auth, validation, point awards, catalog costs, reward codes, gacha rolls, and AI prompts.

```mermaid
flowchart TD
  User[User] --> UI[SvelteKit mobile UI]
  UI --> Auth[Auth + session]
  UI --> Proof[Care proof upload]
  Proof --> VerifyAPI[/api/verify]
  VerifyAPI --> Security[Image validation + metadata stripping]
  VerifyAPI --> Gemini[Gemini verification]
  VerifyAPI --> DB[(Turso / LibSQL)]
  DB --> Points[Purrpoints]
  Points --> Rewards[Rewards]
  Points --> Gacha[Gacha jar]
  Gacha --> Inventory[Cosmetic inventory]
  Inventory --> Home[Virtual pet scene]
  UI --> Vet[AI Vet]
  Vet --> VetAPI[/api/vet/triage]
  VetAPI --> Gemini
```

## Boundary

The browser is untrusted. Server routes derive user ID from the session and enforce costs, point amounts, ownership, and limits.
