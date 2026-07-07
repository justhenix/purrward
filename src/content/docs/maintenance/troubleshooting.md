---
title: Troubleshooting
description: Common local development failures and short fixes.
section: Maintenance
order: 2
---

<!-- Developer doc: quick troubleshooting fixes. -->

# Troubleshooting

## Gemini error

Check `GEMINI_API_KEY` and model env values. Restart the dev server.

## OAuth redirect mismatch

Match `GOOGLE_REDIRECT_URI` to the exact local or deployed callback URL.

## Database not configured

Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN`, or use supported local DB config.

## Camera permission blocked

Allow camera permission in the browser, then reopen proof upload.

## Image too large

Use jpeg, png, or webp under 5MB.

## Not enough points

Earn proof points first, or use sandbox only for local demo checks.

## Theme not updating

Check Profile theme preference and root `data-theme`.

## Asset not loading

Check filename, import mapping, generated cat asset JSON, and case.

## Build/check failure

Run `bun run check` first, fix the typed Svelte error, then rerun lint.
