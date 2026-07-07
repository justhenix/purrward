---
title: Configuration
description: High-level environment setup process.
section: Setup
order: 3
---

<!-- Developer doc: configuration flow for Purrward. -->

# Configuration

Use `.env.example` as the setup source.

1. Copy `.env.example` to `.env`.
2. Fill in database, auth, OAuth, and AI values.
3. Restart the dev server after changing env values.
4. Use sandbox/demo behavior only when live credentials are missing or intentionally disabled.

Do not put secrets in client code, Markdown docs, tickets, screenshots, or logs.
