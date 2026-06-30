---
inclusion: fileMatch
fileMatchPattern: "src/**"
name: structure
description: Repo structure and key file locations for Purrward.
---

# Repo Structure

```
├── AGENTS.md                    # Runtime agent rules (points to .kiro/ and .agents/)
├── .agents/
│   └── skills.json              # Points other agents (Codex/Antigravity/Claude Code) → .kiro/skills/
├── .kiro/
│   ├── steering/                # Persistent project knowledge for Kiro IDE (inclusion modes)
│   │   ├── product.md           # always — stack, scope, MVP
│   │   ├── code-style.md        # always — Svelte 5, TS, commits
│   │   ├── security.md          # auto   — full security spec
│   │   ├── design.md            # auto   — design system + links design-guardrails skill
│   │   ├── structure.md         # fileMatch(src/**)
│   │   ├── assets.md            # manual — asset inventory
│   │   ├── demo.md              # manual — demo + submission
│   │   ├── caveman.md           # manual — caveman mode rules
│   │   ├── caveman-commit.md    # manual — caveman commit rules
│   │   ├── caveman-compress.md  # manual — caveman memory compression
│   │   └── ponytail.md          # manual — ponytail lazy-dev rules
│   ├── skills/                  # Kiro native skills (also read by all agents via .agents/skills.json)
│   │   ├── grill-me/
│   │   │   └── SKILL.md         # alignment interview workflow
│   │   └── purrward-design-guardrails/
│   │       └── SKILL.md         # design constraints and hard bans
│   ├── specs/
│   │   └── core-platform/       # SDD spec for MVP
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── hooks/
│       └── purrward.json        # v1 event-driven hooks
├── drizzle/                     # DB migrations
├── src/
│   ├── app.d.ts                 # SvelteKit type declarations
│   ├── app.html                 # HTML shell
│   ├── lib/
│   │   ├── assets/              # Static assets (images, icons)
│   │   ├── server/
│   │   │   ├── auth.ts          # Auth utilities
│   │   │   ├── security.ts      # Security middleware
│   │   │   └── db/
│   │   │       ├── index.ts     # DB client
│   │   │       └── schema.ts    # Drizzle schema
│   │   └── vitest-examples/     # Test examples
│   └── routes/
│       ├── +layout.svelte       # Root layout (imports layout.css)
│       ├── +page.svelte         # Home page
│       ├── layout.css           # Global stylesheet (design tokens)
│       ├── auth/                # Auth routes
│       ├── dev/                 # Dev mode routes
│       ├── rewards/             # Rewards routes
│       └── vet/                 # Vet routes
├── static/                      # Static public files
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc               # Cloudflare Workers config
```

## Key Paths

- Global styles: `src/routes/layout.css`
- DB schema: `src/lib/server/db/schema.ts`
- Auth: `src/lib/server/auth.ts`
- Security: `src/lib/server/security.ts`
