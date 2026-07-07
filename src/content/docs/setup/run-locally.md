---
title: Run locally
description: Install, run, check, test, lint, and build commands.
section: Setup
order: 2
---

<!-- Developer doc: local run commands for Purrward. -->

# Run locally

Install dependencies, start the dev server, then run checks.

```bash
bun install
bun run dev
bun run check
bun test
bun run lint
bun run build
```

Live AI, OAuth, and database flows need environment variables. Restart the dev server after changing `.env`.
