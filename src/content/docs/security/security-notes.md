---
title: Security notes
description: Concrete security rules for auth, points, rewards, gacha, uploads, and AI.
section: Security
order: 1
---

<!-- Developer doc: security notes for protected Purrward flows. -->

# Security notes

Keep these rules intact:

- Sessions use HttpOnly cookies.
- Care proof logic is server-owned.
- Points are server-owned.
- Reward codes are server-owned.
- Gacha RNG is server-owned.
- Images are validated before verification.
- Metadata is stripped where supported.
- Rate limits protect sensitive endpoints.
- Client never decides user ID, point amount, reward cost, or gacha result.

Trust boundary:

```text
Client -> SvelteKit server route -> validation -> DB / Gemini
```

Never expose API keys, OAuth secrets, raw session IDs, or real credentials in client code.
