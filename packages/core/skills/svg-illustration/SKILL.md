---
name: svg-illustration
description: Use when authoring a hand-drawn SVG illustration, vector art, or a scene/character graphic for an OpenCanva design — "draw an illustration of X", "make a vector graphic", "illustrate this concept", "add a hero illustration". Not for diagrams, flowcharts, or dividers — those use the existing Box/Line/Text primitives per canva-authoring.
---

# Draw an SVG illustration

This skill covers organic/illustrative vector art — a hero graphic, a scene, a character, a decorative
mark bigger than a simple glyph. Diagrams, flowcharts, and dividers stay with `Box`/`Line`/`Text` per
**`canva-authoring`** — that's a different discipline (layout math), not this one (composition/lighting
technique).

## Hosting

Use `<Illustration>` (from `@opencanva/core`), not `<Icon>`:

```tsx
import { useId } from 'react';
import { Illustration } from '@opencanva/core';

function CoffeeCup() {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200">
      <defs>
        <linearGradient id={`${uid}-cup`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ox-accent)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--ox-accent) 60%, #1a1a4e 40%)" />
        </linearGradient>
      </defs>
      <rect x="40" y="60" width="120" height="100" rx="12" fill={`url(#${uid}-cup)`} />
    </svg>
  );
}

<Illustration x={120} y={200} w={300} h={300} name="Coffee cup illustration">
  <CoffeeCup />
</Illustration>
```

- The inner `<svg>` always declares `width="100%" height="100%"` and its own `viewBox="0 0 W H"` — an
  internal coordinate space independent of the object's outer `w`/`h` (artboard pixels). The board's
  stylesheet also sizes `.ox-illustration > svg` to fill the box by default, but set the attributes
  anyway — it's the documented contract, not a fallback to lean on.
- Set `name="…"` for a real layers-panel label.
- **If you factor the illustration into a reusable component** (the pattern `canva-authoring` teaches
  for repeated shapes), its return value must be a single root `<svg>` — not wrapped in a `<div>`, not
  a `Fragment` with siblings. The sizing rule above targets a *direct* SVG child; a wrapper silently
  defeats it, with nothing to signal why the illustration renders at the wrong size.
- **The inspector's fill swatch on an `<Illustration>` colors the "Background" mat behind the SVG, not
  the artwork itself** — visible only if the SVG has transparent margins. Recolor the illustration by
  editing its own `fill`/`stroke`/`stop-color`/`color-mix()` values directly, not through the swatch.

## This is JSX, not raw SVG

Multi-word attributes are camelCase — `stopColor`, `strokeLinecap`, `strokeWidth`, `patternUnits`,
`clipPath` — never kebab-case (`stop-color`, `stroke-linecap`), and `class` is `className`. Most SVG
reference material online is written in raw-SVG kebab-case; copying it verbatim fails `tsc`.

## Every `<defs>` id must be unique per rendered instance

Gradients, masks, `clipPath`s, and filters are referenced by `url(#id)`. A hardcoded id collides the
moment the same illustration renders twice — a reusable component used more than once in one design,
or this app's own live-canvas-plus-thumbnail double render. Call `useId()` once at the top of the
component and interpolate it into every id, stripping the colons `useId()` includes by default (safe
as a plain attribute value, but not worth depending on being safe inside a `url(#…)` reference too):

```tsx
import { useId } from 'react';
const uid = useId().replace(/:/g, '');
// id={`${uid}-sky`}  ...  fill={`url(#${uid}-sky)`}
```

## No external references, scripts, or event handlers; no nested `<foreignObject>`

No `<image href="https://…">`, no `@import`, no `<script>`, no inline `onclick`/etc. External
references are already known to break the rasterized PNG/PDF export path; scripts/handlers have no
purpose in a static export and are a plain security smell; a nested `foreignObject` risks colliding
with the one the export pipeline already wraps the whole board in. This is authoring guidance, not
something the primitive enforces — designs are trusted source, not sanitized input.

## Filter bleed vs. the object's own box

A glow, drop-shadow, or blur filter commonly paints outside the geometric bounds of the shape it's
applied to — that's normal. Two different edges can clip it, with two different fixes:

- **The SVG's own viewport edge.** Expand the `viewBox` to include the bleed margin (content nominally
  at `0,0`–`400,400` needs `viewBox="-20 -20 440 440"` for a 20px blur margin).
- **The `<Illustration>` object's own `w`/`h` on the artboard.** Expanding the viewBox alone keeps the
  bleed *inside* the object's existing frame — it does not make it visually extend past the frame into
  the surrounding canvas. If that's the goal, size the object itself larger than the visual subject and
  center the subject with margin inside it, the same "budget the box for what you want visible"
  principle `canva-authoring` applies at the artboard edge, just one level down.

## Build workflow

1. Block out the composition with primitive shapes (`rect`, `ellipse`, `polygon`) before adding path
   detail — don't start with freehand bezier curves on a blank canvas.
2. Render and look — a separate, explicit step, not blended into "build it well": open the design in
   the dev server, actually view it, and run `window.__ox.lint()`.
3. Fix by editing the SVG in place with targeted edits; batch every fix spotted in one look into a
   single pass before re-rendering.
4. A full-bleed illustration touching its container edges is expected — the lint's crowding check
   exempts illustrations by design, the same way it exempts `Ellipse`/`Image`. Don't shrink a correct
   composition chasing a warning that isn't firing.
5. **The lint does not check illustrations for occlusion yet, in either direction** (hidden behind
   another object, or hiding one). Visually confirm both, every time — this is one thing automated
   checking won't catch for you.

## Technique

- Multi-stop gradients (4+ stops, hue-shifted) — a flat 2-stop gradient reads as flat.
- A few tonal zones for volume: highlight → base → shadow. Shadows shift cooler/darker, never pure
  black.
- Organic or character shapes: build in a fixed order (torso → limbs → head), checking after each
  addition — not all at once.
- A scene is layered back-to-front (far → near), not painted in one flat pass.

## Theme integration

Fills, strokes, and gradient stops reference `var(--ox-accent)` etc. so the illustration restyles with
the theme, the same as every other primitive. The tonal range the technique above needs
(highlight/shadow variants) comes from the theme's one flat accent via `color-mix()`, not a separate
hardcoded palette:

```
fill="color-mix(in srgb, var(--ox-accent) 70%, white)"          /* highlight */
fill="color-mix(in srgb, var(--ox-accent) 60%, #1a1a4e 40%)"    /* cooled shadow */
```

This resolves identically live and exported — the export pipeline computes styles the same way for
every existing `var(--ox-*)` usage.

## Two styles

- **Rich/layered** (default for a hero illustration) — gradients, lighting, soft shadows, as above.
- **Flat/geometric** (small marks) — grid-snapped shapes, arcs and straight lines only, no gradients.

No separate catalogue — the palette itself already comes from the design's theme; pick the style by
role (hero vs. small mark), not by browsing options.

## Self-review

- Rendered and viewed at real size; `window.__ox.lint()` is clean (a full-bleed crowding warning would
  be a bug in the lint, not your composition — it's exempted by design).
- Colors are theme tokens or `color-mix()` derivations, not hardcoded hex.
- No stray meta-text (echoed prompt, style name) baked into the artwork.
- Content stays inside its `viewBox`; nothing hidden behind or hiding another object, checked by eye.
- Every `<defs>` id is `useId()`-derived, not a static string.
