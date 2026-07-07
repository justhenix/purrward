---
title: Customization flow
description: How owned cosmetics render in the homepage pet scene.
section: Flows
order: 4
---

<!-- Developer doc: customization and equipped cosmetic flow. -->

# Customization flow

Owned cosmetics can be equipped on the homepage pet scene.

- Owned cosmetics are account-wide inventory items.
- Equipped items render on the homepage pet scene.
- Backgrounds change the scene.
- Accessories render as overlays on the cat.
- Home Corner is default.
- Cat Park is unlockable.

Important files:

- `src/routes/cats/`
- `src/routes/+page.svelte`
- `src/lib/home/PetScene.svelte`
- `src/lib/server/catalog.ts`
- `src/lib/server/inventory.ts`
