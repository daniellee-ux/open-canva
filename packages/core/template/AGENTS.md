# AGENTS.md

Guidance for **any** coding agent (Claude Code, OpenAI Codex, Cursor, Copilot, …) working in this OpenCanva project. `CLAUDE.md` is a copy of this file; **`AGENTS.md` is the source** — if you edit it, run `cp AGENTS.md CLAUDE.md` to keep them in sync.

This is an **OpenCanva** workspace: each design is a React component under `designs/<id>/index.tsx`, rendered on a zoomable canvas, edited by clicking objects (the edit lands back in the source), and exported to PNG / SVG / PDF.

## Commands

```bash
npm install
npm run dev      # → http://localhost:5173 ; open a design at /d/<id>
npm run build    # production build
npm run sync     # re-copy the bundled agent skills — run after a fresh clone (to populate
                 # .claude/skills for Claude Code) or after upgrading @opencanva/core
```

## Authoring designs — read the skills first

The authoring know-how ships as **Agent Skills** under `.agents/skills/` (and `.claude/skills/`). Before writing or editing anything under `designs/`, read **`.agents/skills/canva-authoring/SKILL.md`** — it's the source of truth for the file contract, the object primitives, the coordinate system, the design tokens, and the inspector-compatibility rules. Use **`create-design`** to make a new graphic, **`create-theme`** for a new palette, **`apply-comments`** to process inspector markers, **`current-design`** to resolve "this design".

## Hard rules (these break the editor silently if violated)

- **Position objects with literal numbers** (`x={120}`), not expressions — the click-to-source write-back rewrites the literal in place; an expression gets clobbered.
- **Never assign `Scene.name`** (`Function.name` is read-only and throws) — use `Scene.label`.
- **Theme via tokens** — use `var(--ox-accent)`, `var(--ox-fg)`, etc. for colors so a theme change restyles everything.
- Keep objects within the artboard (`0…w` / `0…h`).

## Verify by running

`npm run dev`, open `/d/<id>`, and look — `tsc` passing does not mean it renders correctly. Watch the console for the layout lint, or call `window.__ox.lint()`.
