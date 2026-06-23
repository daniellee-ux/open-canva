# Contributing to OpenCanva

Thanks for your interest! OpenCanva is an agent-native graphic-design framework:
designs are React components under `designs/<id>/`, rendered on a zoomable canvas,
edited via click-to-source, and exported to PNG / SVG / PDF.

**[`AGENTS.md`](AGENTS.md)** (mirrored to `CLAUDE.md`) is the shared guide for
**both humans and AI coding agents** — read it first. It covers the architecture,
the file contract, and the hard rules.

## Getting started

```bash
npm install
npm run dev          # → http://localhost:5173 ; open a design at /d/<id>
npm run typecheck    # tsc on @opencanva/core
```

There is **no build step** — the CLI runs TypeScript directly via `tsx`.

## Layout

- `packages/core` (`@opencanva/core`) — runtime, Vite plugin, CLI, primitives, and
  the bundled agent skills. Published to npm.
- `apps/demo` (`@opencanva/demo`) — the demo workspace; ships only the `start-here`
  starter. Designs you add under `designs/` stay local (git-ignored).

## The golden rule: verify by running

`tsc` passing does **not** mean it works. Run `npm run dev`, open the design, and
look. The dev build also runs a layout lint — call `window.__ox.lint()` (or watch
the console) and make sure it's clean. Mind the **Hard rules** in `AGENTS.md`
(literal positions, one zoom transform on `.ox-canvas`, the stringly-typed
`--ox-*` / `data-ox-*` / `/__ox/*` identifiers) — they break silently if violated.

## Skills

Authoring know-how ships as **Agent Skills**, canonically in
`packages/core/skills/`. If you change them, run **`npm run sync`** to mirror them
into `apps/demo/.agents/skills/` (committed) and `.claude/skills/` (local), then
commit. CI's `check:sync` fails if the committed copy drifts.

## Before you open a PR

Make sure these pass — CI runs all of them:

```bash
npm run typecheck                                        # core
npx tsc --noEmit -p apps/demo                            # designs
npx tsc --noEmit -p packages/core/template/tsconfig.json # init template
npm run check:sync                                       # skills / template / lockfile / CLAUDE.md in sync
node scripts/check-template-scaffold.mjs                 # the init template installs + typechecks in isolation
npm run build                                            # production build of apps/demo
```

- **Commits:** use [Conventional Commits](https://www.conventionalcommits.org/)
  (`fix:`, `feat:`, `chore:`, `docs:`, …).
- **Keep PRs focused** — one concern per PR.
- **Don't commit `.claude/`** — it's regenerated locally; the committed, vendor-neutral
  agent copy lives in `.agents/`.

## License

By contributing, you agree your contributions are licensed under the project's
[Apache-2.0](LICENSE) license.
