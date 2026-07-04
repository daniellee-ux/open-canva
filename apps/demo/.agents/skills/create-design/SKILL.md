---
name: create-design
description: Use this skill when the user wants to create, draft, design, or generate a new graphic in this OpenCanva repo — a social post, poster, flyer, ad, thumbnail, story, business card, quote card, or carousel. Triggers on "design a poster about X", "make an Instagram post for", "create a thumbnail", "new graphic", or adding content under `designs/`. Do NOT use for editing the framework itself — only for authoring graphics under `designs/<id>/`.
---

# Create a design in OpenCanva

This skill owns the **workflow** for making a new graphic. The technical reference — file contract, object primitives, coordinate system, design tokens — lives in the **`canva-authoring`** skill. Read that before writing code. You only write files under `designs/<id>/`; never modify `package.json`, `opencanva.config.ts`, or other designs.

## Step 1 — Clarify the brief (ask before designing)

Use `AskUserQuestion` to lock in, unless the user's message already answers them:

1. **Purpose & message** — what is this graphic for, and what is the ONE thing it must say? (If the request is thin, ask this first.)
2. **Format / size** — where will it be used? Map it to an artboard preset (Instagram post 1080×1080, story 1080×1920, YouTube thumbnail 1280×720, A4 poster, etc.). Default: `instagram-post`.
3. **Vibe / visual style** — if the brief doesn't pin the style down, ask — see "Choosing the visual style" below. Ask in vibe space, never as a list of theme names.
4. **Single board or set** — one graphic, or a multi-board carousel / size variants?

Skip any question the user already answered; restate your assumption so they can correct it.

## Choosing the visual style

When the visual style is unclear, ask ONE `AskUserQuestion` question in **vibe space** — style directions, not preset names (the tool caps options at 4, and preset names mean nothing to the user yet). Pick the 3–4 directions most plausible for the brief:

- **Bold & loud** — big type, hard contrast (tags: `bold`)
- **Minimal & clean** — restrained, lots of air (`minimal`, `calm`)
- **Elegant & editorial** — serifs, print feel (`elegant`, `editorial`)
- **Playful & colorful** — friendly, energetic (`playful`)
- **Warm & cozy** — cream, coral, coffee tones (`warm`)
- **Tech & futuristic** — neon, mono, precise (`tech`)
- **Retro** — nostalgic shapes and palettes (`retro`)

Make each option concrete in its description (name a color feel or type feel, e.g. "big black type, one red accent"). If light-vs-dark matters and the brief doesn't say, add it as a second question in the same `AskUserQuestion` call rather than a second round-trip.

Then **map the answer to a preset** using the theme catalog below: filter by tags (including `light`/`dark`), then match the vibe line and display font to the brief. State your pick with its vibe and one alternate — "Going with `riptide` (high-impact cobalt poster); say the word for `bold-poster` (loud type, one red) instead" — and proceed; don't ask another round unless the user pushes back.

**When no preset fits** — the user has brand colors, answered "Other", or the combination is missing (e.g. dark + elegant + playful) — compose custom tokens instead: follow the **`create-theme`** skill's guidance and add an inline `export const design` to the design file. A preset is a starting point, never a cage.

### Theme catalog

<!-- theme-catalog:start -->

_Generated from `designPresets` by `npm run gen:catalog` — do not edit by hand._

| Theme | Vibe | Tags | Display font |
| --- | --- | --- | --- |
| `ember` | Warm coral and gold on deep charcoal — the confident default. | dark, bold, warm | Poppins |
| `noir` | Film-noir black and white with a single gold flourish. | dark, elegant, minimal | Playfair Display |
| `sunset` | Dusk plum glowing with coral and amber. | dark, warm, playful | Poppins |
| `mint` | Fresh green and ocean blue on airy off-white. | light, calm, minimal | Poppins |
| `blueprint` | Engineering blueprint — deep navy, cyan, all-mono type. | dark, tech, minimal | SFMono-Regular |
| `bubblegum` | Candy pink and violet — soft, rounded, upbeat. | light, playful, bold | Poppins |
| `bold-signal` | High-impact near-black with signal orange and gold. | dark, bold | Archivo Black |
| `botanical` | Premium dark serif with soft gold and blush. | dark, elegant, warm | Cormorant |
| `swiss` | Bauhaus white, black grotesque type, one red accent. | light, bold, minimal, editorial | Archivo Black |
| `apricot` | Warm retro geometry — apricot orange on cream. | light, warm, retro, playful | Poppins |
| `avocado` | Crisp cobalt-and-lime duotone on white. | light, bold, minimal | Archivo Black |
| `berry` | Fruity raspberry and periwinkle — fresh and friendly. | light, playful, warm | Syne |
| `blockframe` | Maximalist candy — hot pink and mustard, hard edges. | light, bold, playful, retro | Archivo Black |
| `bold-poster` | Loud poster type with one unmissable red. | light, bold, editorial | Archivo Black |
| `burst` | Sunny yellow dashboard energy with mint and lilac. | light, bold, playful | Archivo Black |
| `cobalt` | Fashion editorial — oversized type, cobalt on dusty rose. | light, bold, editorial | Archivo Black |
| `coral` | Warm and friendly — signature coral on soft sand. | light, warm, calm | Fraunces |
| `electric` | Clean high-contrast blue with a lime spark. | light, bold, tech | Manrope |
| `grove` | Parchment and forest green — quiet editorial. | light, editorial, calm, warm | Fraunces |
| `jade` | Calm minimal green — soft and mindful. | light, calm, minimal | Fraunces |
| `lime` | Electric lime SaaS energy with black slab type. | light, bold, tech | Archivo Black |
| `macchiato` | Warm monochrome — almond, cream, espresso. | light, warm, minimal, elegant | Fraunces |
| `monochrome` | Quiet text-first ivory in near-mono ink. | light, minimal, editorial | Fraunces |
| `neon` | Futuristic navy with cyan and magenta neon. | dark, tech, bold | Space Grotesk |
| `notebook` | Cream paper editorial with soft tabbed accents. | light, editorial, elegant, calm | Bodoni Moda |
| `papier` | Matisse paper-cut calm — aqua and navy on warm paper. | light, calm, playful | Fraunces |
| `riptide` | High-impact cobalt poster on warm sand. | light, bold, editorial | Archivo Black |
| `salmon` | Clean stamp poster — salmon and leaf green on white. | light, minimal, playful | Archivo Black |
| `specimen` | Loud type-specimen graphics — green and acid yellow. | light, bold, editorial | Archivo Black |
| `terminal` | Developer terminal — green-on-ink monospace. | dark, tech, minimal | JetBrains Mono |
| `vintage` | Witty vintage serif on cream with a terracotta wink. | light, retro, editorial, elegant | Fraunces |
| `violet` | Highlighter violet and lime marker energy. | light, playful, bold | Archivo Black |
| `voltage` | Night-mode electric blue and neon yellow. | dark, bold, tech | Syne |

<!-- theme-catalog:end -->

## Step 2 — Pick an id

Kebab-case, short, descriptive: `summer-sale`, `launch-poster`, `quote-card`. Check `designs/` to avoid collisions.

## Step 3 — Plan the composition

Before writing, sketch the layout in words: the focal element, the supporting text, the accents/decoration, and roughly where each sits on the artboard (top band, centered headline, bottom CTA…). Decide the visual hierarchy — one element should dominate.

Also decide the **logical structure**: which objects form self-contained units (a card, a stat, a header cluster). Wrap each unit in a named `<Group name="…">` and factor any repeated unit into a small local subcomponent — so the design reads as a handful of meaningful groups, not a flat pile of objects. (See "Emit logical groupings" in `canva-authoring`.)

## Step 4 — Write `designs/<id>/index.tsx`

Read **`canva-authoring`** first, then write. Place objects with literal pixel coordinates; use `var(--ox-*)` tokens for color so the theme drives the palette. Add `export const artboard`, and `export const meta` with `title`, `theme`, and a real `createdAt` (run `node -e "console.log(new Date().toISOString())"`).

For a carousel/multi-board, export several Scenes; give each an `id` and `label`.

## Step 5 — Self-review

Run the checklist at the end of `canva-authoring` (contract, artboard set, literal coordinates, token colors, createdAt, clear focal point, viewed in browser).

## Step 6 — Hand off

Tell the user the id and that the dev server hot-reloads (`http://localhost:5173/d/<id>`). Mention they can switch on **Edit** to drag/restyle any object (edits land in the source), and **Export** to PNG / SVG / PDF. If dev isn't running: `npm run dev` from the workspace.
