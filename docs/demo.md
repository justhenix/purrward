# Purrward Demo Script

Use this as the 5-minute video outline. Do not claim a deployed URL, scan report, or UI flow until verified.

## 0:00-0:20 Opening

Purrward is a care-to-earn cat wellness app. Owners complete daily routines, prove care with a photo, and earn Purrpoints for useful cat rewards.

## 0:20-1:30 User Flow

1. Open the mobile-first Purrward app.
2. Pick a care task such as feeding or water.
3. Upload a photo proof.
4. Show the verification result.
5. Show points increasing and a reward option.

If the UI upload flow is not ready, show the route/API flow as a technical fallback and clearly say the UI wiring is still in progress.

## 1:30-2:45 Technical Flow

Explain the server path:

```text
auth session -> upload validation -> metadata strip -> Gemini JSON verification -> daily caps -> DB transaction -> points ledger
```

Call out that `event.locals.user` owns the request and the client never submits a user ID or point amount.

## 2:45-3:45 Security

Show `docs/security.md` and mention:

- HttpOnly Google OAuth session cookie.
- Upload MIME and size validation.
- JPEG/PNG metadata stripping before AI.
- Server-owned Gemini prompt.
- Rate limits and daily caps.
- Parameterized Drizzle queries.

If a real Aikido or other scan exists, show it. If using Dev Mode mock evidence, label it as a mock/demo panel.

## 3:45-4:30 UX / Theme

Show the cozy cat wellness direction: soft paper UI, supportive care states, readable mobile layout, and rewards tied to real cat care.

## 4:30-5:00 Close

Summarize why it is more than a habit tracker: photo verification and a server-side points ledger make care-to-earn trustworthy enough for rewards.

## Backup Narration

If the live demo fails: show README, route code, tests passing, and the security checklist. Keep the story focused on the verified care pipeline.
