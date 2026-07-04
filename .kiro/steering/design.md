---
inclusion: auto
name: design
description: Design system and guardrails for Purrward UI. Enforces cozy feline wellness aesthetics and blocks generic AI/SaaS/dev-dashboard styles. Load when editing Svelte components, routes, CSS, or anything visual.
---

# Design System

## Core Direction

Purrward is a cozy mobile-first cat wellness app. Clean modern card UI wrapped in subtle watercolor paper warmth. Approachable, warm, playful, and trustworthy.

## Colors

### Core

| Token           | Value     | Use                             |
| --------------- | --------- | ------------------------------- |
| `paper`         | `#FDF8EF` | Main app background             |
| `paper-2`       | `#FFFDF8` | Raised cards                    |
| `paper-3`       | `#F6EEDB` | Secondary warm surface          |
| `charcoal`      | `#242626` | Primary text, primary button    |
| `charcoal-soft` | `#343837` | Softer dark UI / nav background |
| `ink`           | `#171A19` | Highest contrast text           |
| `muted`         | `#7A746B` | Secondary text                  |
| `line`          | `#E8DECB` | Borders and dividers            |

### Accents (watercolor pigment feel)

| Token        | Value     | Use                               |
| ------------ | --------- | --------------------------------- |
| `sage`       | `#A9C8A8` | Wellness, completed care          |
| `sage-soft`  | `#DCEAD7` | Success backgrounds               |
| `peach`      | `#F4BFA8` | Warm reward moments               |
| `peach-soft` | `#FBE2D4` | Soft highlight backgrounds        |
| `sky`        | `#A9D9E8` | Hydration, vet calm               |
| `sky-soft`   | `#DDF3F7` | Gentle info backgrounds           |
| `butter`     | `#F6D98B` | Points, gacha, positive highlight |
| `rose`       | `#E9A7B5` | Care/emotional accent             |

### Semantic

| State   | Background | Text      |
| ------- | ---------- | --------- |
| Success | `#DCEAD7`  | `#406B43` |
| Warning | `#FFF0C7`  | `#8A651B` |
| Danger  | `#FAD8D4`  | `#9C3329` |
| Info    | `#DDF3F7`  | `#2F6470` |

### Dark Mode

Soft charcoal, not pure black.

| Token            | Value     |
| ---------------- | --------- |
| `dark-bg`        | `#1F2322` |
| `dark-surface`   | `#2A2F2E` |
| `dark-surface-2` | `#333938` |
| `dark-text`      | `#F8F1E6` |
| `dark-muted`     | `#C7BFB2` |
| `dark-line`      | `#444B49` |

## Typography

Two fonts only:

1. **Quicksand** — display headings, section titles, cat names, reward moments.
2. **Inter** — body, buttons, forms, navigation, dense UI.

**Never monospace.**

| Role          | Size    | Weight  | Font      |
| ------------- | ------- | ------- | --------- |
| Hero title    | 28–34px | 700     | Quicksand |
| Screen title  | 22–26px | 700     | Quicksand |
| Section title | 18–22px | 700     | Quicksand |
| Card title    | 16–18px | 700     | Either    |
| Body          | 14–16px | 400–500 | Inter     |
| Caption       | 12–13px | 500     | Inter     |
| Button        | 14–16px | 700     | Inter     |

## Layout

- Mobile-first PWA. 16–20px side padding.
- Desktop: centered mobile-like app shell, not stretched dashboard.
- Bottom nav: Home, Rewards, Vet, Cat, Community.
- Bottom nav style: soft charcoal pill container, paper white active circle, simple icons.

### Spacing

| Token     | Value |
| --------- | ----- |
| `space-1` | 4px   |
| `space-2` | 8px   |
| `space-3` | 12px  |
| `space-4` | 16px  |
| `space-5` | 20px  |
| `space-6` | 24px  |
| `space-8` | 32px  |

### Shape

| Element     | Radius          |
| ----------- | --------------- |
| Small chips | 999px           |
| Buttons     | 18–24px or pill |
| Cards       | 24–32px         |
| Hero cards  | 32–40px         |
| Bottom nav  | 28–36px         |

## Cards

Base card CSS:

```css
.card {
	background: var(--color-paper-2);
	border: 1px solid var(--color-line);
	border-radius: 28px;
	box-shadow: 0 14px 40px rgba(36, 38, 38, 0.08);
}
```

## Guardrails & Visual Constraints

Refer to the project's visual constraints, bans, and checklist:

#[[file:.kiro/skills/purrward-design-guardrails/SKILL.md]]
