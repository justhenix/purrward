---
inclusion: manual
name: demo
description: Demo script and submission checklist for #hackthekitty. Load when preparing demo video or final submission.
---

# Demo Script (5 minutes)

## 0:00–0:20 Opening

Purrward is a care-to-earn cat wellness app. Owners complete daily routines, prove care with a photo, earn Purrpoints for useful cat rewards.

## 0:20–1:30 User Flow

1. Open the mobile-first Purrward app.
2. Pick a care task (feeding, water).
3. Upload photo proof.
4. Show verification result.
5. Show points increasing and a reward option.

If UI upload flow not ready → show route/API flow as technical fallback. Say the UI wiring is in progress.

## 1:30–2:45 Technical Flow

```
auth session → upload validation → metadata strip → Gemini JSON verification → daily caps → DB transaction → points ledger
```

Call out: `event.locals.user` owns the request. Client never submits user ID or point amount.

## 2:45–3:45 Security

Show security rules and mention:
- HttpOnly Google OAuth session cookie
- Upload MIME and size validation
- EXIF stripping before AI
- Server-owned Gemini prompt
- Rate limits and daily caps
- Parameterized Drizzle queries

Real scan → show it. Mock evidence → label as demo panel.

## 3:45–4:30 UX / Theme

Show cozy cat wellness direction: soft paper UI, supportive care states, readable mobile layout, rewards tied to real cat care.

## 4:30–5:00 Close

More than a habit tracker: photo verification + server-side points ledger make care-to-earn trustworthy.

## Backup

If live demo fails: show README, route code, tests passing, security checklist. Keep story on verified care pipeline.

---

# Submission Checklist

- [ ] README explains Purrward in under two minutes
- [ ] Demo video recorded and matches implemented features
- [ ] Screenshots or GIFs captured from real app
- [ ] `bun run check`, `bun test`, `bun run lint` pass
- [ ] Security pre-deploy checklist completed
- [ ] Real scan/report attached if available
- [ ] Mock/dev-mode evidence labeled as mock
- [ ] Theme relevance sentence in submission text
- [ ] No accidental personal identity in public assets if anonymity required
- [ ] No secrets in repo, screenshots, terminal output, or demo video
