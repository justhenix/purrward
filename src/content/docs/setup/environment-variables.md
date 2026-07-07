---
title: Environment variables
description: Safe groups of env values used by Purrward.
section: Setup
order: 4
---

<!-- Developer doc: environment variable groups without secrets. -->

# Environment variables

Reference `.env.example`. Do not paste real secrets.

## Database

- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`

## Auth and sessions

- Server-side session cookies.
- Session rows in the database.
- `DEV_AUTH_RESET_LINKS` for local-only reset helper behavior.

## Google OAuth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

## Gemini AI

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_VET_MODEL`
- `AI_VET_DAILY_LIMIT`

## Cloudflare and deployment

- `wrangler.jsonc`
- Generated Worker types from Wrangler.

## Reward limits

- `COUPON_TRADE_DAILY_LIMIT`
