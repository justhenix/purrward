---
title: Care verification flow
description: Photo proof upload, validation, AI verification, and point award.
section: Flows
order: 1
---

<!-- Developer doc: care proof verification flow. -->

# Care verification flow

```mermaid
flowchart LR
  A[Choose care task] --> B[Take photo]
  B --> C[Upload proof]
  C --> D[Validate image]
  D --> E[AI verification]
  E --> F{Pass?}
  F -->|Yes| G[Award points]
  F -->|No| H[Show reason]
```

Important files:

- `src/routes/care-proof/`
- `src/routes/api/verify/+server.ts`
- `src/lib/server/photo-verification.ts`
- `src/lib/server/security.ts`

The server validates task type and upload type before Gemini sees the image.
