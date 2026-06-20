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
3. **Vibe / theme** — bold, minimal, elegant, playful? Propose a built-in theme (`ember`, `noir`, `sunset`, `mint`, `blueprint`, `bubblegum`) or offer to craft custom tokens.
4. **Single board or set** — one graphic, or a multi-board carousel / size variants?

Skip any question the user already answered; restate your assumption so they can correct it.

## Step 2 — Pick an id

Kebab-case, short, descriptive: `summer-sale`, `launch-poster`, `quote-card`. Check `designs/` to avoid collisions.

## Step 3 — Plan the composition

Before writing, sketch the layout in words: the focal element, the supporting text, the accents/decoration, and roughly where each sits on the artboard (top band, centered headline, bottom CTA…). Decide the visual hierarchy — one element should dominate.

## Step 4 — Write `designs/<id>/index.tsx`

Read **`canva-authoring`** first, then write. Place objects with literal pixel coordinates; use `var(--ox-*)` tokens for color so the theme drives the palette. Add `export const artboard`, and `export const meta` with `title`, `theme`, and a real `createdAt` (run `node -e "console.log(new Date().toISOString())"`).

For a carousel/multi-board, export several Scenes; give each an `id` and `label`.

## Step 5 — Self-review

Run the checklist at the end of `canva-authoring` (contract, artboard set, literal coordinates, token colors, createdAt, clear focal point, viewed in browser).

## Step 6 — Hand off

Tell the user the id and that the dev server hot-reloads (`http://localhost:5173/d/<id>`). Mention they can switch on **Edit** to drag/restyle any object (edits land in the source), and **Export** to PNG / SVG / PDF. If dev isn't running: `npm run dev` from the workspace.
