# OpenCanva

**The agent-native graphic design framework.** Design graphics as React components, click any object on the canvas to nudge or restyle it (the edit lands in your source), and export to PNG / SVG / PDF. The canvas analog of [open-slide](https://github.com/1weiho/open-slide) and [open-doc](https://github.com/daniellee-ux/open-doc) — same portable spine, a new artifact model.

```
discover files  →  virtual module  →  React component contract  →  click-to-source editing  →  export
  (Vite glob)      (loadDesign)        (export default Scene[])      (loc-tags + fiber)         (png/svg/pdf)
```

## Quick start

```bash
npm install
npm run dev          # → http://localhost:5173
```

Open a design at `/d/<id>`. Toggle **Edit** to select objects, drag to move, grab handles to resize/rotate, recolor, or leave a comment for your agent. Hit **Export** for PNG / SVG / PDF.

## The model: objects on an artboard

A *design* lives in `designs/<id>/index.tsx` and default-exports an array of **Scenes** (artboards). Each Scene places **graphic objects** at absolute pixel coordinates:

```tsx
import { Box, Text, Ellipse, type Scene, type Artboard, type DesignMeta } from '@opencanva/core';

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

export const artboard: Artboard = { w: 1080, h: 1080 };
export const meta: DesignMeta = { title: 'My poster', theme: 'sunset', createdAt: '2026-06-20T12:00:00Z' };
export default [Poster] satisfies Scene[];
```

- `export default` is `Scene[]` — one component per artboard (most designs have one; several = a carousel / size set).
- Objects: `<Box>`, `<Text>`, `<Ellipse>`, `<Line>`, `<ImageObject>`, `<Group>`, `<Icon>` — positioned with `x/y/w/h`, rotated with `rotate`, themed with `var(--ox-*)` tokens.
- Themes: `ember`, `noir`, `sunset`, `mint`, `blueprint`, `bubblegum` (see `/themes`), or roll your own `DesignSystem`.

## Why it's agent-native

- **Click-to-source.** Every object you click resolves to the exact `<Box>`/`<Text>` in your source (via injected `data-ox-loc` read off the React fiber — works across files and components). Drag/resize/recolor rewrite the object's props **in place** through a dev-only write-back API; the source stays byte-stable so HMR is surgical.
- **Comments → edits.** Leave a `@canva-comment` on any object; the bundled `apply-comments` skill applies them.
- **Current-design pointer.** The dev server writes `.opencanva/current.json` so an agent can resolve "this design / the object I selected".
- **Works with any agent.** A root `AGENTS.md` (the cross-tool standard read by Codex, Cursor, Copilot, …) carries the repo guide, and `CLAUDE.md` symlinks to it. The authoring skills — `canva-authoring`, `create-design`, `apply-comments`, `current-design`, `create-theme` — ship as Agent Skills: `opencanva sync` copies them into both `.agents/skills/` (vendor-neutral, committed) and `.claude/skills/` (local). `opencanva init` scaffolds a new project with all of it baked in.

## Layout

```
packages/core      @opencanva/core — runtime, Vite plugin, CLI, primitives, skills, project template
apps/demo          demo workspace — ships the start-here starter; your own designs stay local
```

`opencanva <dev|build|preview|sync|init>` runs the TypeScript CLI directly via `tsx` — no build step.
