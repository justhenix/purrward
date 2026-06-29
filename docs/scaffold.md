# Purrward Scaffold

Purrward is a mobile-first care-to-earn cat wellness PWA. Cat owners log healthy routines, verify care with photo proof, earn Purrpoints, and redeem rewards or vet help.

## Current Stack

- SvelteKit 5 + TypeScript + Bun
- TailwindCSS v4 via `@tailwindcss/vite`
- Cloudflare Pages/Workers via `@sveltejs/adapter-cloudflare`
- Turso/LibSQL via Drizzle ORM
- Google OAuth with HttpOnly session cookies
- Gemini REST API for photo verification and AI vet triage
- `driver.js` for guided onboarding if needed

## Source Map

- Runtime rules: `AGENTS.md`
- Roadmap: `docs/steps.md`
- Security architecture: `docs/security.md`
- Design system: `docs/design.md`
- Asset inventory: `docs/assets.md`
- Commit style: `docs/commit.md`

## Current Repo Shape

```text
D:/DevProj/hackkitty/
├── AGENTS.md
├── README.md
├── docs/
│   ├── assets.md
│   ├── commit.md
│   ├── design.md
│   ├── demo.md
│   ├── scaffold.md
│   ├── security.md
│   ├── submission.md
│   └── steps.md
├── drizzle/
├── src/
│   ├── app.d.ts
│   ├── app.html
│   ├── lib/
│   │   ├── assets/
│   │   ├── server/
│   │   │   ├── auth.ts
│   │   │   ├── security.ts
│   │   │   └── db/
│   │   │       ├── index.ts
│   │   │       └── schema.ts
│   │   └── vitest-examples/
│   └── routes/
│       ├── +layout.svelte
│       ├── +page.svelte
│       ├── layout.css
│       ├── auth/
│       ├── dev/
│       ├── rewards/
│       └── vet/
├── static/
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc
```

## Auth Summary

Flow: `/auth/google` redirects to Google consent, `/auth/callback` exchanges the code server-side, creates/updates the user, stores a server session in Turso, and sets a secure HttpOnly cookie. Protected endpoints read `event.locals.user`.

## Verification Summary

Core demo flow:

```text
cat-care habit -> photo upload -> server validation -> metadata strip -> Gemini verification -> anti-cheat cap -> points ledger -> rewards
```

Full rules live in `docs/security.md` and roadmap tasks live in `docs/steps.md`.
