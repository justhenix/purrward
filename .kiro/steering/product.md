---
inclusion: always
name: product
description: Core product context for Purrward — stack, scope, MVP boundaries, and source locations.
---

# Purrward — Product Context

Purrward is a mobile-first care-to-earn cat wellness PWA for #hackthekitty 2026. Cat owners log healthy routines, verify care with photo proof, earn Purrpoints, and redeem rewards or vet help.

## Stack

- SvelteKit 5 (runes only) + TypeScript strict + Bun
- TailwindCSS v4 via `@tailwindcss/vite`
- Cloudflare Pages/Workers via `@sveltejs/adapter-cloudflare`
- Turso/LibSQL via Drizzle ORM
- Google OAuth 2.0 with HttpOnly session cookies
- Gemini REST API for photo verification and AI vet triage
- `driver.js` for guided onboarding

## Source of Truth

All project knowledge lives in `.kiro/`. See the file index in `AGENTS.md` for where each topic lives.

## Scope

MVP first. Do not build Good-to-Have items unless explicitly requested.

### MVP Features

- Google OAuth + session management
- Habit tracker + photo uploads
- Gemini AI image verification (anti-cheat)
- Points system + Turso storage
- Basic cat avatar
- AI vet chat (triage)

### Good-to-Have (Do Not Build Unless Asked)

- Dev mode / security panel / Aikido mock
- Gacha mechanics
- Solana Web3 incentives
- Polaroid scrapbook
- Co-op community goals
- Cat park showcase
