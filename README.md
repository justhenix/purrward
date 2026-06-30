# Purrward

Purrward is a care-to-earn cat wellness PWA for #hackthekitty 2026. It rewards cat owners for consistent routines like feeding, water, litter care, play, grooming, and medication.

## Demo Flow

Core product loop:

```text
cat-care task -> photo proof -> server validation -> metadata strip -> Gemini verification -> daily anti-cheat caps -> Turso points ledger -> rewards
```

The home screen now wires this flow through the secure `/api/verify` endpoint. Live OAuth, Turso, and Gemini credentials still need a final smoke test before recording the demo.

## Why It Fits

Purrward makes the cat theme functional, not decorative: the app rewards real feline care, rejects unrelated or low-confidence proof, and keeps rewards tied to a server-side wellness ledger.

## Stack

- SvelteKit 5 + TypeScript + Bun
- TailwindCSS v4
- Cloudflare Pages/Workers
- Turso/LibSQL + Drizzle ORM
- Google OAuth + HttpOnly sessions
- Gemini REST API for photo verification

## Security Highlights

- Google OAuth callback exchanges tokens server-side only.
- Session cookie is HttpOnly, SameSite=Strict, and Secure in production.
- Protected endpoints use `event.locals.user`; client user IDs are ignored.
- Photo uploads enforce jpeg/png and 5MB max.
- JPEG/PNG metadata is stripped before Gemini.
- Gemini prompt is server-owned and asks for JSON-only verification.
- Daily upload and task caps limit point farming.
- Points are awarded in a server-side DB transaction.

## Quickstart

```powershell
bun install
Copy-Item .env.example .env
bun run dev
```

Fill `.env` with Turso, Google OAuth, and Gemini credentials before testing auth or verification.

## Checks

```powershell
bun run check
bun test
bun run lint
```

## Docs

- [Scaffold](docs/scaffold.md)
- [Security](docs/security.md)
- [Design](docs/design.md)
- [Roadmap](docs/steps.md)
- [Demo Script](docs/demo.md)
- [Submission Checklist](docs/submission.md)
