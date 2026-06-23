# create-opencanva

Scaffold a new [OpenCanva](https://github.com/daniellee-ux/open-canva) project in one command.

```bash
npm create opencanva@latest my-designs
cd my-designs
npm install
npm run dev          # → http://localhost:5173
```

OpenCanva is an **agent-native graphic-design framework**: designs are React
components you (or an AI agent) author under `designs/<id>/`, rendered on a
zoomable canvas, edited via click-to-source, and exported to PNG / SVG / PDF.

## What you get

The scaffold drops a ready-to-run project into the target directory:

- **`designs/start-here/`** — a starter design to open and learn from
- **`opencanva.config.ts`** + **`tsconfig.json`** — preconfigured
- **`AGENTS.md`** (+ a byte-identical `CLAUDE.md` copy) — the cross-tool repo guide
- **`.agents/skills/`** and **`.claude/skills/`** — the five authoring skills
  (`canva-authoring`, `create-design`, `apply-comments`, `current-design`,
  `create-theme`) so Claude Code, Codex, Cursor, … can author for you out of the box
- **`@opencanva/core`** pinned as a dependency

Then `npm install && npm run dev`, open <http://localhost:5173>, and load a design at `/d/<id>`.

## Usage

```bash
npm create opencanva@latest [target-dir]
```

`target-dir` defaults to the current directory. The scaffolder refuses to run
**inside the OpenCanva framework monorepo** or a **non-empty** directory (a small
allowlist like `LICENSE` / `README` / `.vscode` / `.idea` is tolerated).

## How it works

This is a thin wrapper: its bin resolves
[`@opencanva/core`](https://www.npmjs.com/package/@opencanva/core) and runs
`opencanva init`. All scaffolding logic lives in core.

## License

[Apache-2.0](https://github.com/daniellee-ux/open-canva/blob/main/LICENSE)
