# Purrward Design System

> Source of truth for Purrward's visual direction, layout rules, interaction patterns, and implementation tokens.  
> Available anti-slop/design skills are negative guardrails. This file defines the actual design.

---

## 1. Product Feeling

Purrward is a cozy, mobile-first cat wellness app. It should feel like a modern care companion with a soft artistic layer, not like an AI SaaS dashboard.

**Core direction:**

- **Modern clean card UI** as the foundation.
- **Restrained watercolor warmth** as the artistic layer.
- **Paper soft white** as the main surface.
- **Soft charcoal** for dark surfaces and primary actions.
- **Friendly, calm, pet-care focused** rather than loud, gamified, or technical.

**Reference interpretation:**

The clean card UI reference uses large rounded cards, generous whitespace, pill controls, floating bottom navigation, image-led cards, and strong black/white contrast. Purrward should borrow that modern clarity, then soften it with paper texture, hand-drawn accents, watercolor wash edges, and cat-care illustration.

**Design sentence:**

> Purrward is a clean mobile card UI wrapped in subtle watercolor paper warmth.

---

## 2. Non-Negotiable Design Rules

1. **No monospace fonts anywhere.**
   - Not for logs.
   - Not for timestamps.
   - Not for badges.
   - Not for dev mode.
   - Not for “AI/system” flavor.

2. **No AI-generated image assets.**
   - Use real approved project assets, artist-made assets, icons, CSS shapes, or wireframe placeholders.
   - If an image asset does not exist yet, use a wireframe placeholder instead.

3. **Watercolor must be restrained.**
   - Do not turn every card into a painting.
   - Use watercolor mostly for background atmosphere, soft blobs, small illustrations, and accent moments.

4. **Clean card UI first.**
   - Cards should be readable, structured, and functional.
   - Artistic choices should support the interface, not fight it.

5. **Do not make it look like an AI startup.**
   - No purple/blue AI gradients.
   - No glassmorphism.
   - No neon glow.
   - No “LIVE” tech badges.
   - No fake metrics.
   - No generic 3-card SaaS layout.

---

## 3. Visual Personality

| Trait     | Direction                                           | Avoid                              |
| --------- | --------------------------------------------------- | ---------------------------------- |
| Warmth    | Soft, pet-parent friendly, calm                     | childish cartoon overload          |
| Modernity | Clean cards, smooth spacing, strong hierarchy       | cluttered scrapbook UI             |
| Art       | Subtle watercolor, paper texture, hand-drawn edges  | excessive watercolor everywhere    |
| Trust     | Clear states, readable text, calm vet guidance      | flashy gamified casino feel        |
| Play      | Cat avatar, reward moments, small delightful motion | noisy animations and confetti spam |

---

## 4. Color System

### 4.1 Core Colors

| Token           |     Value | Use                                         |
| --------------- | --------: | ------------------------------------------- |
| `paper`         | `#FDF8EF` | Main app background / soft paper white      |
| `paper-2`       | `#FFFDF8` | Raised cards / clean white cards            |
| `paper-3`       | `#F6EEDB` | Secondary warm surface                      |
| `charcoal`      | `#242626` | Primary text, primary button, dark surfaces |
| `charcoal-soft` | `#343837` | Softer dark UI / nav background             |
| `ink`           | `#171A19` | Highest contrast text                       |
| `muted`         | `#7A746B` | Secondary text                              |
| `line`          | `#E8DECB` | Borders and dividers                        |

### 4.2 Watercolor Accent Colors

Use accents sparingly. They should feel like watercolor pigment on paper.

| Token        |     Value | Use                                         |
| ------------ | --------: | ------------------------------------------- |
| `sage`       | `#A9C8A8` | Wellness, completed care, calm success      |
| `sage-soft`  | `#DCEAD7` | Success backgrounds                         |
| `peach`      | `#F4BFA8` | Warm reward moments                         |
| `peach-soft` | `#FBE2D4` | Soft highlight backgrounds                  |
| `sky`        | `#A9D9E8` | Hydration, vet calm, secondary accent       |
| `sky-soft`   | `#DDF3F7` | Gentle info backgrounds                     |
| `butter`     | `#F6D98B` | Points, gacha, positive highlight           |
| `rose`       | `#E9A7B5` | Care/emotional accent, warnings if softened |

### 4.3 Semantic Colors

| State   | Background | Text / Border | Notes                             |
| ------- | ---------: | ------------: | --------------------------------- |
| Success |  `#DCEAD7` |     `#406B43` | Verified habit, completed routine |
| Warning |  `#FFF0C7` |     `#8A651B` | Low confidence, incomplete care   |
| Danger  |  `#FAD8D4` |     `#9C3329` | Emergency vet warning             |
| Info    |  `#DDF3F7` |     `#2F6470` | AI triage info, tips              |

### 4.4 Dark Mode

Dark mode is **soft charcoal**, not pure black.

| Token            |     Value | Use                  |
| ---------------- | --------: | -------------------- |
| `dark-bg`        | `#1F2322` | Main dark background |
| `dark-surface`   | `#2A2F2E` | Cards                |
| `dark-surface-2` | `#333938` | Raised controls      |
| `dark-text`      | `#F8F1E6` | Main text            |
| `dark-muted`     | `#C7BFB2` | Secondary text       |
| `dark-line`      | `#444B49` | Borders              |

Dark mode should still feel cozy, not developer-terminal.

---

## 5. Typography

### 5.1 Fonts

Use two fonts only:

1. **Quicksand**
   - Display headings
   - Friendly section titles
   - Reward moments
   - Cat profile names

2. **Inter**
   - Body text
   - Buttons
   - Forms
   - Navigation
   - Dense UI text

**Never use monospace.**

### 5.2 Type Scale

| Role              | Mobile Size |  Weight | Font               | Notes                 |
| ----------------- | ----------: | ------: | ------------------ | --------------------- |
| Hero / page title |     28–34px |     700 | Quicksand          | Use sparingly         |
| Screen title      |     22–26px |     700 | Quicksand          | Main page headers     |
| Section title     |     18–22px |     700 | Quicksand          | Card groups           |
| Card title        |     16–18px |     700 | Quicksand or Inter | Depends on density    |
| Body              |     14–16px | 400–500 | Inter              | Default content       |
| Caption           |     12–13px |     500 | Inter              | Metadata, helper copy |
| Button            |     14–16px |     700 | Inter              | Clear actions         |

### 5.3 Copy Tone

Use plain pet-care language.

Good:

- “Log today’s feeding”
- “Upload a bowl photo”
- “Mochi looks hydrated today”
- “Ask about vomiting, appetite, or behavior”
- “This may need urgent vet care”

Avoid:

- “Supercharge your feline wellness journey”
- “AI-powered care ecosystem”
- “Unlock seamless pet optimization”
- “LIVE verification engine”

---

## 6. Layout Principles

### 6.1 Mobile-First Shell

Purrward is primarily a mobile PWA.

- Max content width on mobile: full width with `16px–20px` side padding.
- Desktop should show a centered mobile-like app shell or responsive two-column layout, not a stretched dashboard.
- Important actions should be thumb reachable.
- Bottom navigation is preferred for core routes.

### 6.2 Spacing

| Token     | Value | Use                  |
| --------- | ----: | -------------------- |
| `space-1` |   4px | Micro gaps           |
| `space-2` |   8px | Icon/text gaps       |
| `space-3` |  12px | Compact card padding |
| `space-4` |  16px | Standard padding     |
| `space-5` |  20px | Section spacing      |
| `space-6` |  24px | Screen blocks        |
| `space-8` |  32px | Major screen breaks  |

### 6.3 Shape

| Element     |          Radius |
| ----------- | --------------: |
| Small chips |           999px |
| Buttons     | 18–24px or pill |
| Cards       |         24–32px |
| Hero cards  |         32–40px |
| Bottom nav  |         28–36px |
| Image cards |         28–36px |

Use generous radii like the reference, but do not make every element bubbly.

---

## 7. Cards

Cards are the main layout primitive.

### 7.1 Base Card

Use for routines, rewards, vet prompts, profile blocks.

```css
.card {
	background: var(--color-paper-2);
	border: 1px solid var(--color-line);
	border-radius: 28px;
	box-shadow: 0 14px 40px rgba(36, 38, 38, 0.08);
}
```

### 7.2 Card Types

| Card             | Use                        | Visual Rule                                                 |
| ---------------- | -------------------------- | ----------------------------------------------------------- |
| Hero card        | Cat avatar + daily summary | Larger radius, soft paper surface, optional watercolor blob |
| Routine card     | Habit check item           | Clear status, icon, action button                           |
| Photo proof card | Upload / verification      | Wireframe placeholder if no image asset                     |
| Reward card      | Coupons, points, gacha     | Slightly warmer accent, still clean                         |
| Vet card         | AI triage entry points     | Calm, high readability, serious states respected            |
| Scrapbook card   | Verified care memory       | Polaroid frame only if asset exists                         |

### 7.3 Artistic Card Layer

Allowed artistic choices:

- 1–2 faint watercolor blobs behind the card content.
- Paper texture as background layer.
- Slight irregular hand-drawn divider line.
- Small cat paw / whisker accent.
- Subtle tape/sticker look for scrapbook only.

Avoid:

- Full-card rainbow watercolor.
- Heavy border textures.
- Every card using different styles.
- Decorative elements covering text.

---

## 8. Image and Asset Strategy

### 8.1 Approved Asset Sources

Use only:

- Assets from `docs/assets.md` when available.
- Hand-made / artist-provided project assets.
- Simple SVG icons created specifically for the project.
- CSS shapes, paper texture, and abstract watercolor accents.
- Wireframe placeholders when final assets are missing.

### 8.2 No AI-Generated Images

Do not generate or import AI images for:

- Cat avatars
- Backgrounds
- Vet illustrations
- Reward products
- Community cats
- Scrapbook images

### 8.3 Missing Asset Rule

If the final image asset does not exist yet, use a **wireframe image placeholder**.

Wireframe placeholder style:

- Paper/cream rectangle.
- Rounded corners matching the card.
- Thin warm border.
- Simple line icon or label.
- Optional diagonal skeleton lines.
- No fake photo realism.
- No AI art.

Example placeholder labels:

- “Cat avatar asset pending”
- “Home watercolor background pending”
- “Reward image pending”
- “Scrapbook photo placeholder”

### 8.4 Avatar Asset Plan

From `assets.md`, expected avatar system:

- Base cats: orange tabby, tuxedo, grey.
- Face states: happy, sad, sleepy.
- Accessories: flower crown, rain hat, bandanna, glasses.

Until available, use clean wireframe avatar silhouettes.

---

## 9. Navigation

### 9.1 Bottom Navigation

Use a floating bottom nav similar to the reference, adapted to Purrward.

Core tabs:

1. **Home** — daily care dashboard.
2. **Rewards** — Purrpoints, coupons, gacha.
3. **Vet** — AI triage and booking.
4. **Cat** — avatar/customizer/profile.
5. **Community** — scrapbook / co-op goals if included.

Style:

- Soft charcoal pill container.
- Paper white active circle.
- Simple rounded icons.
- No emoji-only navigation.
- No monospace labels.

### 9.2 Top Bars

Use minimal top bars:

- Greeting + user avatar on Home.
- Back button + title on detail screens.
- Heart/favorite only if relevant.
- Settings/filter buttons as soft circular controls.

---

## 10. Core Screens

### 10.1 Home Dashboard

Purpose: show the cat, today’s routines, and next best action.

Recommended structure:

1. Greeting: “Hello, [Name]”
2. Cat status hero card
3. Today’s care checklist
4. Purrpoints summary
5. Soft prompt: “Need help? Ask the vet”

Visual notes:

- Cat avatar is the emotional center.
- Watercolor blob can sit behind the avatar.
- Cards remain clean and readable.

### 10.2 Habit Tracker / Photo Verification

Purpose: complete care tasks and verify with photo proof.

Routine items:

- Feeding
- Water
- Litter
- Play
- Grooming
- Medication

States:

| State           | Visual                           |
| --------------- | -------------------------------- |
| Not started     | Paper card, muted icon           |
| Pending upload  | Soft sky background              |
| Verifying       | Gentle spinner / paw step motion |
| Verified        | Sage success state               |
| Rejected        | Warm warning, helpful retry copy |
| Locked / capped | Muted, clear explanation         |

Do not shame the user. Pet-care UX should be supportive.

### 10.3 Rewards Store

Purpose: redeem Purrpoints for practical cat-care benefits.

Sections:

- Points balance
- Vet discounts
- Pet store coupons
- Gacha jar / accessories
- Donation or shelter contribution if co-op goals are included

Visual notes:

- Reward cards can use warmer accents.
- Avoid casino/gambling visuals.
- Gacha should feel playful, not predatory.

### 10.4 AI Vet Chat

Purpose: calm first-line feline triage.

Visual notes:

- More restrained than the rest of the app.
- Use readable chat bubbles.
- Emergency warnings must be highly visible.
- No playful decoration on emergency states.

Required UX states:

- Intro prompt with scope: feline health, behavior, nutrition.
- Symptom quick chips.
- Emergency banner for severe symptoms.
- Clear disclaimer: AI triage is not a replacement for emergency vet care.

### 10.5 Vet Booking

Purpose: simulated real vet consultation using points.

Recommended structure:

- Vet profile card.
- Available time slots.
- Points cost.
- Booking confirmation.
- Status timeline.

Keep it simple for hackathon scope.

### 10.6 Cat Avatar / Customizer

Purpose: emotional ownership and gamification.

Recommended structure:

- Large cat preview card.
- Mood/state indicator.
- Accessory categories.
- Owned vs locked items.
- Save outfit button.

Visual notes:

- Use actual assets if available.
- If not, use wireframe avatar and accessory placeholders.
- Do not use AI-generated cats.

### 10.7 Scrapbook

Purpose: wholesome flexing of verified care.

Recommended structure:

- Polaroid-style cards.
- Date and routine type.
- Captions if implemented.

Visual notes:

- Use the polaroid asset if available.
- If not, use simple paper cards with photo placeholders.
- Keep scrapbook cozy but not cluttered.

### 10.8 Dev Mode

Purpose: show judges technical depth without damaging the user-facing design.

Dev Mode must still follow Purrward visual rules:

- No monospace.
- No terminal aesthetic.
- No hacker dashboard.
- No neon.
- No “LIVE” badges.

Use clean cards to show:

- Security checklist.
- Verification workflow.
- Mock Cloudflare trace.
- Mock Aikido scan.
- Temporal scheduling demo.

Dev Mode should feel like a product-quality technical appendix, not a different app.

---

## 11. Components

### 11.1 Buttons

Primary:

- Soft charcoal background.
- Paper text.
- Pill or large radius.
- Used for main actions only.

Secondary:

- Paper surface.
- Charcoal text.
- Warm border.

Accent:

- Use sage, peach, or butter sparingly for positive moments.

Danger:

- Use for emergency / destructive states only.

### 11.2 Pills / Chips

Use for:

- Routine filters.
- Symptom quick prompts.
- Reward categories.
- Cat accessory categories.

Rules:

- Pill shape.
- Soft background.
- Clear selected state.
- No excessive outlines.

### 11.3 Forms and Inputs

Style:

- Rounded pill or rounded rectangle.
- Paper white surface.
- Warm border.
- Large tap target.

Do not over-style forms with heavy watercolor.

### 11.4 Icons

Preferred:

- Simple rounded line icons.
- Custom pet-care icons when possible.
- Consistent stroke width.

Avoid:

- Emoji as primary UI.
- Generic tech icons for normal user flows.
- Overusing sparkles.

---

## 12. Motion

Motion should be gentle and useful.

Allowed:

- Button press softness.
- Card lift on tap/hover.
- Verification progress animation.
- Cat mood transition.
- Points increment animation.
- Small paw-step loading motion.

Avoid:

- Scroll animation everywhere.
- Constant bouncing.
- Excessive confetti.
- Fast neon/glow effects.

Motion duration:

- Micro interactions: `120–180ms`
- Card transitions: `180–240ms`
- Page transitions: `240–320ms`

---

## 13. Accessibility

Minimum requirements:

- Body text contrast must be readable on paper and dark surfaces.
- Tap targets should be at least `44px`.
- Do not rely on color only for state.
- Provide text labels for icons.
- Emergency vet warnings must be clear for screen readers.
- Keep body copy simple and direct.

---

## 14. Tailwind v4 Token Draft

Use these as starting variables in the global stylesheet imported by `src/routes/+layout.svelte` (`src/routes/layout.css` today).

```css
@theme {
	--font-display: 'Quicksand', ui-sans-serif, system-ui, sans-serif;
	--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

	--color-paper: #fdf8ef;
	--color-paper-2: #fffdf8;
	--color-paper-3: #f6eedb;

	--color-charcoal: #242626;
	--color-charcoal-soft: #343837;
	--color-ink: #171a19;
	--color-muted: #7a746b;
	--color-line: #e8decb;

	--color-sage: #a9c8a8;
	--color-sage-soft: #dcead7;
	--color-peach: #f4bfa8;
	--color-peach-soft: #fbe2d4;
	--color-sky: #a9d9e8;
	--color-sky-soft: #ddf3f7;
	--color-butter: #f6d98b;
	--color-rose: #e9a7b5;

	--color-success-bg: #dcead7;
	--color-success-text: #406b43;
	--color-warning-bg: #fff0c7;
	--color-warning-text: #8a651b;
	--color-danger-bg: #fad8d4;
	--color-danger-text: #9c3329;
	--color-info-bg: #ddf3f7;
	--color-info-text: #2f6470;

	--radius-card: 28px;
	--radius-card-lg: 36px;
	--radius-pill: 999px;

	--shadow-card: 0 14px 40px rgba(36, 38, 38, 0.08);
	--shadow-float: 0 18px 50px rgba(36, 38, 38, 0.16);
}
```

### 14.1 Base CSS Direction

```css
html {
	background: var(--color-paper);
	color: var(--color-ink);
	font-family: var(--font-sans);
}

body {
	min-height: 100vh;
	background:
		radial-gradient(circle at 12% 10%, rgba(169, 217, 232, 0.22), transparent 28%),
		radial-gradient(circle at 88% 18%, rgba(244, 191, 168, 0.18), transparent 30%),
		var(--color-paper);
}

h1,
h2,
h3,
.display-font {
	font-family: var(--font-display);
}
```

Gradients here are background atmosphere only, not AI-SaaS hero gradients.

---

## 15. Implementation Checklist

Before shipping a screen, check:

- [ ] Does the screen feel like clean card UI first?
- [ ] Is the watercolor layer subtle?
- [ ] Are missing images wireframe placeholders instead of AI-generated assets?
- [ ] Are there zero monospace fonts?
- [ ] Does the screen avoid generic AI SaaS visual tropes?
- [ ] Is the main action obvious within 3 seconds?
- [ ] Are care states supportive and clear?
- [ ] Does dark mode use soft charcoal, not pure black?
- [ ] Does the screen still feel like Purrward without relying on decoration?

---

## 16. Relationship to Other Docs

- `docs/scaffold.md` defines product concept and architecture.
- `docs/security.md` defines security posture.
- `docs/assets.md` defines intended art assets.
- `docs/steps.md` defines development roadmap.
- Available anti-slop/design skills block generic AI design habits.
- `docs/design.md` is the positive design source of truth.
