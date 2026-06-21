---
name: canva-authoring
description: Technical reference for writing or editing OpenCanva designs — the file contract, the artboard/object model, the primitive kit, the coordinate system, the design tokens, and the inspector-compatibility rules. Consult this whenever you are about to write or modify any file under `designs/<id>/`, including from inside the `create-design` or `apply-comments` workflows, or for any ad-hoc edit. Triggers on "edit this design", "move that headline", "change the colors", "fix the layout", "how do designs work here".
---

# Authoring OpenCanva designs

This is the **technical reference** for everything under `designs/<id>/`. It owns no workflow — `create-design` owns "make a new graphic", `apply-comments` owns "process inspector markers", `current-design` resolves "this design" to a concrete id. When any of those reach the point of *writing React for a design*, this is the source of truth.

## The model: objects on an artboard

A design is **not** a flowing document. It is one or more fixed-size **artboards** (Scenes); on each artboard you place **graphic objects** — text, boxes, ellipses, lines, images — at **absolute pixel coordinates**. You own the layout entirely (x, y, width, height). The framework owns theming, the canvas (zoom/pan), the inspector, and export.

The single most important rule: **position everything explicitly, in artboard pixels.** The origin `(0,0)` is the top-left of the artboard; `x` grows right, `y` grows down.

## File contract

```tsx
// designs/<id>/index.tsx
import { Box, Text, Ellipse, type Scene, type DesignMeta, type Artboard } from '@opencanva/core';

const Poster: Scene = () => (
  <>
    <Ellipse x={700} y={-120} w={500} h={500} fill="var(--ox-accent)" opacity={0.3} />
    <Text x={80} y={120} w={900} size={160} weight={800} font="display">Big headline</Text>
    <Box x={80} y={820} w={360} h={120} fill="var(--ox-accent)" radius={60}>
      <Text x={0} y={0} w={360} h={120} align="center" valign="center" size={44} weight={700} color="#fff">
        Shop now →
      </Text>
    </Box>
  </>
);
Poster.id = 'poster';
Poster.label = 'Poster';

export const artboard: Artboard = { w: 1080, h: 1080 };
export const meta: DesignMeta = { title: 'My poster', theme: 'sunset', createdAt: '2026-06-20T12:00:00Z' };
export default [Poster] satisfies Scene[];
```

- `export default` is a **non-empty array of zero-prop React components** (`Scene[]`), one per **artboard**, in order. Most designs have a single Scene; multiple Scenes form a carousel / multi-board set (laid side by side on the canvas).
- Scene metadata is set as **static properties** on the component:
  - `Scene.id` — stable id for the layers panel + deep links. Always set it.
  - `Scene.label` — human name shown in the board switcher. **Never `Scene.name`** — `Function.name` is a read-only built-in and assigning to it throws.
  - `Scene.artboard` — per-scene size override (e.g. one story board among square boards).
- `export const artboard: Artboard = { w, h, background? }` — the default size for every scene. Use a preset size (see below). Omit `background` to inherit the theme's `--ox-bg`; set it (a color or gradient) to override.
- `export const meta: DesignMeta` — `title`, optional `theme` (a preset name), and a **quoted ISO 8601 `createdAt`** (run `node -e "console.log(new Date().toISOString())"`; never type it from memory).
- Optional: `export const design: DesignSystem` to fully customize tokens instead of using a named `theme`.

### Artboard sizes

Import `artboardPresets` or just write the numbers. Common sizes:

| Preset | w × h | Use |
| --- | --- | --- |
| `instagram-post` / `square` | 1080 × 1080 | IG feed, general social |
| `instagram-story` | 1080 × 1920 | Stories / Reels covers |
| `instagram-portrait` | 1080 × 1350 | IG portrait |
| `youtube-thumbnail` | 1280 × 720 | Thumbnails |
| `presentation-16x9` | 1920 × 1080 | Slides / banners |
| `poster-a4-portrait` | 1240 × 1754 | Print posters |
| `business-card` | 1050 × 600 | Cards |

## Object primitive kit (import from `@opencanva/core`)

Every object takes `x, y` (position), `w, h` (size), and optional `rotate` (deg, around center), `z` (stacking; later siblings are on top by default), `opacity`.

| Component | Key props | Use |
| --- | --- | --- |
| `<Box>` | `fill`, `radius`, `borderColor`, `borderWidth`, `shadow`, `center` | Rectangles, cards, buttons, color blocks. A container: children position **relative to it**. |
| `<Text>` | `size`, `weight`, `color`, `font` (`display`\|`body`), `align`, `valign`, `lineHeight`, `letterSpacing`, `italic`, `uppercase` | All text. Width sets the wrap measure; height auto unless `h` set. Use `\n` for line breaks. |
| `<Ellipse>` | `fill`, `borderColor`, `borderWidth`, `shadow` | Circles, dots, decorative blobs (often large + low `opacity`). |
| `<Line>` | `w` (length), `thickness`, `color`, `dash`, `rotate` | Dividers, rules, accents. |
| `<ImageObject>` | `src`, `fit` (`cover`\|`contain`), `radius` | Photos/logos. Put files in `designs/<id>/assets/` and use `src="./assets/photo.jpg"`. |
| `<Group>` | (position only) | A transparent container for a **logical unit** (a card's parts, a labelled stat, a header cluster). Move/resize/rotate it as one object; the editor can select it as a unit, and multi-select → **Group**/**Ungroup** wraps or dissolves one. Children position **relative to the group**. |
| `<Icon>` | `glyph` (emoji/char), `size`, `color` | Emoji or a single glyph. Pass SVG as children for custom marks. |

## Authoring rules (these keep the inspector working)

- **Position with literal numbers, not expressions.** Write `x={120}`, not `x={a + 40}`. The click-to-source inspector rewrites the literal in place when the user drags an object; an expression would be clobbered.
- **Group with nesting.** To make a labelled button or a card, nest children inside a `<Box>`/`<Group>` and give the children coordinates **relative to that container** (a child at `x={0} y={0}` sits at the box's top-left). Moving the container moves everything.
- **Emit logical groupings.** Wrap each self-contained unit — a card (its bg + heading + body + icon), a stat (number + label), a header cluster (logo + wordmark), a row of bullets — in a `<Group name="…">`. Give the group a stable `name` (shown in the layers panel). This makes the layers panel readable, lets the user select/move the whole unit at once, and keeps the layout robust. Prefer a handful of meaningful groups over a flat list of 30 absolutely-positioned objects.
- **Factor reusable subcomponents in code.** When the same shape repeats (a stat tile, a list row, a chip), write a small local component (`function StatTile({ x, y, value, label }) { return (<Group x={x} y={y}>…</Group>) }`) and place instances. That is how reuse works here — there is no symbol/instance system; a shared component in source IS the component. Keep its positioned children's coordinates relative to the group so each instance only needs an `x`/`y`.
- **Center text inside a box** by giving the `<Text>` the box's `w`/`h` plus `align="center"` and `valign="center"` — don't rely on `<Box center>` for absolutely-positioned children.
- **Theme via tokens.** Use `var(--ox-accent)`, `var(--ox-accent2)`, `var(--ox-fg)`, `var(--ox-muted)`, `var(--ox-surface)`, `var(--ox-bg)` for `fill`/`color` so a theme change restyles the whole design. Use `font="display"` for headlines, `font="body"` for copy.
- **Stay inside the artboard.** Keep objects within `0…w` / `0…h` (bleeding decoration slightly past an edge is fine — the artboard clips it).
- **One focal point.** Make a single element dominate; everything else supports it. Strong type-size contrast reads better than many medium elements.
- **Never transform the artboard or nest `scale()`** — the inspector's geometry math assumes only the canvas wrapper is scaled. Rotate via the `rotate` prop only.

## Text fit — the #1 thing authors get wrong

Display fonts here (**Archivo Black, Fraunces, Playfair Display, Bodoni Moda, Poppins, Syne, Cormorant**) are **wide**. Text auto-wraps when its content exceeds the box `w`, and if `w` is smaller than a *single word* it breaks **mid-word** (ugly: `Berr`/`y`). Estimating text width by eye is the most common way these designs break. Rules:

- **Size `w` to the longest line, with slack.** A rough lower bound for one line of `N` characters at size `S` in a bold display font is `w ≳ N × S × 0.62` (more for Archivo Black / Fraunces). When in doubt, make `w` bigger. **`w` must always exceed the widest single word**, or it breaks mid-word.
- **Control line breaks explicitly** with `{'\n'}` in headlines, and size `w` to fit the longest resulting line. Don't rely on auto-wrap landing where you hope.
- **Budget vertical space for the lines text actually takes.** A wrapped text grows *down*: its bottom ≈ `y + lines × size × lineHeight`. Place the next element below that, with a gap. Underestimating the line count is what makes the element below it overlap.
- **Text in a fixed-`h` box** (a centered button/badge/pill label) must fit on the intended number of lines at that `w` — otherwise it overflows the box. Give the box enough `w`/`h`, or shrink the text.
- **Big numbers/stats** (`30%`, `99.99%`, `10×`) are single wide "words" — give their box plenty of width.
- **Verify by eye.** Open `/d/<id>`; confirm no headline wraps unintentionally, nothing breaks mid-word, and no two text blocks overlap.

## Layout integrity — get it right up front

A dev-time layout lint measures the **rendered** result (real fonts, colours, stacking, wrapping — not the declared x/y/w/h) and flags these defect classes. Author so none occur; don't lean on fixing them afterward. **Check it:** open `/d/<id>` — the console logs `0 layout issue(s)` when clean, or names each — or call `window.__ox.lint()`.

- **Stacking — text on a box needs a higher `z`, or just nest it.** The single most common trap: a `<Text>` with no `z` (defaults to 0) placed over a `<Box>`/`<Ellipse>` that *has* a `z` → the opaque box paints over its own label and the text disappears. **Preferred fix: nest the `<Text>` inside the `<Box>`** (children always paint above their parent); otherwise give the text a `z` greater than the box's. *(lint: invisible / occluded)*
- **Don't run text under an opaque neighbour.** A headline whose tail slides under an adjacent card, or a word a circular badge cuts into, gets clipped — even two hidden letters read as broken. Size and place text so its glyphs clear opaque siblings: shrink the headline, narrow its `w`, or move the shape. *(lint: occluded)*
- **Leave breathing room — never sit flush against a border, rule, or edge.** Keep ≳ 0.4em (≈16–24px) between any text/figure and its container's border, a divider line, an adjacent block, or the artboard edge. Card-footer text clears the card bottom; a subhead clears its band's bottom edge; a CTA clears the artboard edge; a title or number never jams against a badge. If badge + title + body + gaps don't fit a card, the card is too short or the copy too long — resize or trim, don't cram. *(lint: crowding)*
- **Every rule must be visible.** Don't place a `<Line>` where boxes/cards will paint over it (a "connector" run along the card tops just vanishes behind the cards). Dividers belong in open space. *(lint: occluded line)*
- **Contrast against the surface *actually behind* the text, not the artboard `--ox-bg`.** Text on a coloured card or band must contrast *that* colour (≥ ~3:1). Watch `var(--ox-fg)` on `var(--ox-accent)`, white on a pale tint, or a tinted eyebrow sitting on its own block. *(lint: invisible)*

A clean lint is part of "done."

### Multiple files are fine

Split scenes into sibling files imported by `index.tsx`:

```tsx
import { Cover } from './scenes/cover';
import { Tip } from './scenes/tip';
export default [Cover, Tip] satisfies Scene[];
```

The inspector resolves click-to-source across these files correctly (it reads injected `data-ox-loc` off the fiber chain). Keep design-specific shared components **under `designs/<id>/`** so they stay inspectable.

## Self-review before finishing

1. `export default` is a non-empty `Scene[]`; every scene has an `id` (and a `label` if multi-board).
2. `export const artboard` is set; sizes use a sensible preset.
3. Positions/sizes are **literal numbers**; colors use `var(--ox-*)` tokens.
4. `meta.createdAt` is a real quoted ISO string (from `node -e`).
5. There is a clear focal point and the composition stays within the artboard.
6. Opened the design in the browser (`/d/<id>`) and it looks right at the fitted zoom.
7. The layout lint is clean — `window.__ox.lint()` returns `[]` (console shows `0 layout issue(s)`): no invisible, occluded, crowded, hidden-rule, or off-canvas objects.
