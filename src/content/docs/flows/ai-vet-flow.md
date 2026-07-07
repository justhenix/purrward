---
title: AI Vet flow
description: Triage input cleanup, Gemini prompt wrapper, reply cleanup, and emergency flagging.
section: Flows
order: 5
---

<!-- Developer doc: AI Vet triage flow. -->

# AI Vet flow

```mermaid
flowchart LR
  A[Ask cat question] --> B[Sanitize text]
  B --> C[Server prompt wrapper]
  C --> D[Gemini triage]
  D --> E[Clean reply]
  E --> F{Emergency signs?}
  F -->|Yes| G[Show emergency banner]
  F -->|No| H[Show guidance]
```

AI Vet gives triage guidance only. It does not diagnose, prescribe, or replace a licensed veterinarian.

Important files:

- `src/routes/vet/+page.svelte`
- `src/routes/api/vet/triage/+server.ts`
- `src/lib/server/vet-triage.ts`
- `src/lib/server/security.ts`
