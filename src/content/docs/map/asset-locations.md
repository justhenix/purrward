---
title: Asset locations
description: Where cat, room, jar, paw, and splash assets live.
section: Map
order: 2
---

<!-- Developer doc: Purrward asset locations and naming. -->

# Asset locations

Artist assets live under `src/lib/assets`. Keep filenames and catalog IDs stable when imports depend on them.

| Path                                              | Purpose                                     |
| ------------------------------------------------- | ------------------------------------------- |
| `src/lib/assets/bg/bg-room.webp`                  | Default room background.                    |
| `src/lib/assets/bg/bg-room-dark.webp`             | Dark room background.                       |
| `src/lib/assets/bg/bg_park.webp`                  | Park background.                            |
| `src/lib/assets/bg/bg_park_night.webp`            | Dark park background.                       |
| `src/lib/assets/cats/cats_types/*.webp`           | Base cat sprites.                           |
| `src/lib/assets/cats/expressions/*.webp`          | Happy, sleepy, normal, and sad expressions. |
| `src/lib/assets/cats/expressions/dark_cat/*.webp` | Dark-mode expression variants.              |
| `src/lib/assets/cats/accessories/*.webp`          | Bandana, hats, glasses, and flower crown.   |
| `src/lib/assets/cats/misc/gacha_jar.webp`         | Jar artwork.                                |
| `src/lib/assets/cats/misc/cat-polaroid.webp`      | Polaroid art.                               |
| `src/lib/assets/paint_splash/*.webp`              | Watercolor splash UI accents.               |
| `src/lib/assets/paw/*.webp`                       | Paw icon art.                               |
| `src/lib/assets/cats/cat-assets.ts`               | Asset mapping used by cat UI.               |

Common names:

- `bg-room.webp`
- `bg-room-dark.webp`
- `bg_park.webp`
- `bg_park_night.webp`
- `gacha_jar.webp`
- accessory IDs such as `bandana`, `bucket_hat`, `flower_corn`, `nerd_glasses`, `sun_glasses`
