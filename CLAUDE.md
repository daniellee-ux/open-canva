# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

OpenCanva is an agent-native graphic design framework: designs are React components under `designs/<id>/`, rendered on a zoomable canvas, editable via click-to-source, exported to PNG/SVG/PDF. npm-workspaces monorepo — `packages/core` (`@opencanva/core`: runtime + Vite plugin + CLI + bundled skills) and `apps/demo` (`@opencanva/demo`: the 30 example designs). No build step — the CLI runs TypeScript directly via `tsx`.

## Commands

Run from the repo root (root scripts delegate to the `@opencanva/demo` / `@opencanva/core` workspaces):

```bash
npm install
npm run dev          # opencanva dev → http://localhost:5173 ; open a design at /d/<id>
npm run build        # production build of apps/demo
npm run preview       # serve the production build
npm run typecheck    # tsc --noEmit on @opencanva/core
```

- The demo app runs the CLI directly: `opencanva <dev|build|preview|sync>` (defaults to `dev`).
- `opencanva sync` copies the skills bundled in `packages/core/skills/` into the workspace's `.claude/skills/` (`canva-authoring`, `create-design`, `apply-comments`, `current-design`, `create-theme`).
- To typecheck the designs specifically: `npx tsc --noEmit -p apps/demo` (this is what CI runs alongside the core typecheck).
- **There is no test runner.** "Verify by running" (below) is the test — drive the canvas in a browser; `tsc` passing does not mean it works.

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
