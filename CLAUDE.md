# OpenCanva — agent guide

OpenCanva is an agent-native graphic design framework: designs are React components under `designs/<id>/`, rendered on a zoomable canvas, editable via click-to-source, exported to PNG/SVG/PDF.

## Working in this repo

- **Authoring graphics** (the common task): write/edit files under `designs/<id>/`. Read the **`canva-authoring`** skill first — it's the source of truth for the file contract, the object primitives, the coordinate system, and the inspector-compatibility rules. Use **`create-design`** for the new-graphic workflow, **`apply-comments`** to process inspector markers, **`current-design`** to resolve "this design".
- **Framework code** lives in `packages/core/src/`. The spine (KEEP — don't rewrite): `vite/loc-tags-plugin.ts`, `vite/opencanva-plugin.ts`, `vite/inspector-api.ts`, `app/lib/fiber.ts`, `scene-context.tsx`. The model-specific surface: `app/components/{Stage,Board,Inspector,LayersPanel}.tsx`, `primitives.tsx`, `sdk.ts`, `app/lib/{viewport,export}.ts`.

## Hard rules (these break silently if violated)

- **Never assign `Scene.name`** — `Function.name` is read-only and throws. Use `Scene.label`.
- **Position objects with literal numbers** (`x={120}`), not expressions — the write-back rewrites the literal in place; an expression gets clobbered.
- **One zoom transform only**, on `.ox-canvas`. Never transform the artboard or an object subtree (only the `rotate` prop) — it breaks the inspector's `getBoundingClientRect` math.
- **The `--ox-*` / `data-ox-*` / `virtual:opencanva/*` / `/__ox/*` / `opencanva:*` identifiers are stringly-typed across plugins + app.** Changing one means changing it everywhere or wiring silently no-ops.

## Verify by running

`npm run dev`, open `/d/<id>`, and look. Typecheck is `npm run typecheck`. Don't trust `tsc` alone — drive the canvas.
