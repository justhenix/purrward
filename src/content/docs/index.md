---
title: Project overview
description: Purrward core loop, scope, and system shape.
section: Overview
order: 1
---

<!-- Developer doc: project overview for Purrward. -->

# Project overview

Purrward is a mobile-first cat care app. Users log care, verify proof, earn Purrpoints, redeem rewards, ask AI vet guidance, and customize a virtual pet scene.

Core loop:

```text
care -> proof -> verification -> points -> rewards / cosmetics
```

## What the app does

- Tracks daily cat care habits.
- Verifies care proof with server-owned checks.
- Awards Purrpoints after proof passes.
- Lets users redeem rewards or unlock cosmetics.
- Gives AI Vet triage guidance for cat health questions.
- Shows owned cosmetics on the homepage pet scene.

## MVP boundaries

- Google OAuth and session cookies.
- Habit tracker and photo uploads.
- Gemini photo verification and AI Vet triage.
- Turso / LibSQL data through Drizzle.
- Basic avatar, rewards, gacha, and customization flows.

Demo-only and mock behavior is documented separately.
