# AGENTS.md

Shared guidance for **any** coding agent (Claude Code, OpenAI Codex, Cursor, Copilot, …) working in this repository. `CLAUDE.md` is a symlink to this file, so every tool's conventional entry point resolves here. (On a Windows checkout without symlink support, `CLAUDE.md` may appear as plain text — read `AGENTS.md` directly.)

OpenCanva is an agent-native graphic design framework: designs are React components under `designs/<id>/`, rendered on a zoomable canvas, editable via click-to-source, exported to PNG/SVG/PDF. npm-workspaces monorepo — `packages/core` (`@opencanva/core`: runtime + Vite plugin + CLI + bundled skills) and `apps/demo` (`@opencanva/demo`: the demo workspace — ships only the `start-here` starter guide; any other designs you add under `designs/` are git-ignored and stay local, see `.gitignore`). No build step — the CLI runs TypeScript directly via `tsx`.

## Commands

Run from the repo root (root scripts delegate to the `@opencanva/demo` / `@opencanva/core` workspaces):

```bash
npm install
npm run dev          # opencanva dev → http://localhost:5173 ; open a design at /d/<id>
npm run build        # production build of apps/demo
npm run preview       # serve the production build
npm run typecheck    # tsc --noEmit on @opencanva/core
```

- The demo app runs the CLI directly: `opencanva <dev|build|preview|sync|init>` (defaults to `dev`). Regenerate the committed skills with **`npm run sync`** (it runs in `apps/demo`); bare `opencanva sync` inside this monorepo is refused (it would write a stray skills tree).
- `npm run sync` copies the skills bundled in `packages/core/skills/` into the demo workspace's **`.agents/skills/`** (vendor-neutral, committed) **and `.claude/skills/`** (Claude-specific, git-ignored): `canva-authoring`, `create-design`, `apply-comments`, `current-design`, `create-theme`.
- `opencanva init [dir]` scaffolds a fresh OpenCanva project (config, starter design, and both skill dirs) so a new project is multi-agent ready out of the box.
- To typecheck the designs specifically: `npx tsc --noEmit -p apps/demo` (this is what CI runs alongside the core typecheck).
- **There is no test runner.** "Verify by running" (below) is the test — drive the canvas in a browser; `tsc` passing does not mean it works.

## Skills (how agents get the authoring knowledge)

The authoring know-how ships as **Agent Skills** — `SKILL.md` files with YAML frontmatter, the format Claude Code and the cross-agent `.agents/skills/` convention both read. They live canonically in `packages/core/skills/`. `npm run sync` mirrors them into the **demo workspace** at `apps/demo/.agents/skills/` (committed) and `apps/demo/.claude/skills/` (local); the `check:sync` CI step fails if the committed copy drifts from the canonical one.

(The repo-root `.agents/skills/` holds only `frontend-design` — a third-party design-quality skill vendored for work *on the framework*, tracked in `skills-lock.json`. It is intentionally not part of the bundle `sync`/`init` distribute.)

- **Authoring graphics** (the common task): write/edit files under `designs/<id>/`. Read the **`canva-authoring`** skill first — it's the source of truth for the file contract, the object primitives, the coordinate system, and the inspector-compatibility rules. Use **`create-design`** for the new-graphic workflow, **`apply-comments`** to process inspector markers, **`current-design`** to resolve "this design".
- If your agent does not auto-discover skills, read `apps/demo/.agents/skills/canva-authoring/SKILL.md` directly before editing any design.

## Working in this repo

- **Framework code** lives in `packages/core/src/`. The spine (KEEP — don't rewrite): `vite/loc-tags-plugin.ts`, `vite/opencanva-plugin.ts`, `vite/inspector-api.ts`, `app/lib/fiber.ts`, `scene-context.tsx`. The model-specific surface: `app/components/{Stage,Board,Inspector,LayersPanel,icons}.tsx`, `primitives.tsx`, `sdk.ts`, `app/lib/{viewport,export,overflow,ui-theme}.ts` (`overflow.ts` = the dev layout lint; `ui-theme.ts` = the editor's light/dark chrome theme).

## Hard rules (these break silently if violated)

- **Never assign `Scene.name`** — `Function.name` is read-only and throws. Use `Scene.label`.
- **Position objects with literal numbers** (`x={120}`), not expressions — the write-back rewrites the literal in place; an expression gets clobbered.
- **One zoom transform only**, on `.ox-canvas`. Never transform the artboard or an object subtree (only the `rotate` prop) — it breaks the inspector's `getBoundingClientRect` math.
- **The `--ox-*` / `--ui-*` / `data-ox-*` / `data-ui-theme` / `virtual:opencanva/*` / `/__ox/*` / `opencanva:*` identifiers are stringly-typed across plugins + app.** Changing one means changing it everywhere or wiring silently no-ops. (`--ox-*` are design/canvas tokens scoped to `[data-ox-board]`; `--ui-*` are editor-chrome tokens — light by default with a `[data-ui-theme="dark"]` override — keep the two sets distinct.)

## Verify by running

`npm run dev`, open `/d/<id>`, and look. Typecheck is `npm run typecheck`. Don't trust `tsc` alone — drive the canvas. The dev build also runs a **layout lint** (`app/lib/overflow.ts`): call `window.__ox.lint()` or watch the console on load to catch invisible / occluded / crowded / hidden-rule / off-canvas objects — a clean lint is part of "done". The `canva-authoring` skill's "Layout integrity" section turns these into authoring rules.
