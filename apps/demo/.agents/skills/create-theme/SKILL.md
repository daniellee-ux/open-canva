---
name: create-theme
description: Use this skill when the user wants a new color theme / brand palette for OpenCanva designs — "make a brand theme", "add a dark teal palette", "match these brand colors", "create a theme called X". Produces a `DesignSystem` (palette + font pair + radius) usable via `meta.theme` or `export const design`.
---

# Create an OpenCanva theme

A theme is a `DesignSystem` — a palette, a display/body font pair, and a default corner radius. Its values flow to the `--ox-*` CSS variables that every object references (`var(--ox-accent)`, `var(--ox-fg)`, …). Read **`canva-authoring`** for how designs consume tokens.

## The shape

```ts
import type { DesignSystem } from '@opencanva/core';

export const design: DesignSystem = {
  palette: {
    bg: '#0e1116',       // artboard background
    fg: '#f5f3ee',       // primary text
    muted: '#9aa3af',    // secondary text
    accent: '#ff5c38',   // brand color (CTAs, highlights)
    accent2: '#ffd23f',  // secondary accent
    surface: '#1a1f27',  // cards / panels
  },
  fonts: {
    display: "'Poppins', ui-sans-serif, system-ui, sans-serif",  // headlines
    body: "ui-sans-serif, system-ui, -apple-system, sans-serif", // copy
  },
  radius: 24,            // default corner radius (px)
  vibe: 'Warm ember on deep charcoal.',  // one-line style description (required for presets)
  tags: ['dark', 'bold', 'warm'],        // from: light, dark, bold, minimal, elegant, playful, warm, calm, retro, tech, editorial
};
```

## Two ways to use it

1. **Per design** — add `export const design` to a `designs/<id>/index.tsx` (overrides any `meta.theme`).
2. **Shared preset** — add a named entry to `designPresets` in `packages/core/src/design.ts`, then designs select it with `meta: { theme: 'your-name' }`. This also makes it show up in the `/themes` gallery. Presets must set `vibe` + `tags`; afterwards run `npm run gen:catalog && npm run sync` so the `create-design` skill's theme catalog includes it (CI's `check:sync` fails otherwise).

## Design guidance

- **Contrast first.** `fg` must read clearly on `bg`; `accent` must pop on `bg`. Check both light-on-dark and dark-on-light if the design inverts.
- **Two accents, used sparingly.** `accent` carries the brand; `accent2` is for a secondary highlight. Most of the canvas should be `bg`/`fg`/`muted`.
- **Font pairing.** A characterful `display` (geometric sans, a serif, or a mono) against a neutral `body`. Use real web-safe stacks or Google fonts already loaded by the app (Poppins, Playfair Display).
- **Radius sets the personality.** `0` = sharp/editorial, `8–16` = modern, `28+` = soft/friendly.

## Hand off

Tell the user how to apply it (per-design `export const design`, or the preset name for `meta.theme`), and that the `/themes` page previews all presets. The dev server hot-reloads.
