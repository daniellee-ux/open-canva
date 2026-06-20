---
name: current-design
description: Resolves deictic references to the design the user is currently looking at — "this design", "the graphic I'm on", "this board", "the object I selected", "what I'm viewing" — to a concrete design id, board, and selected object. Consult FIRST when the user references the current design without naming it, then hand off to canva-authoring / apply-comments for the actual edit.
---

# Resolve the current design

When the user says "this design", "the board I'm on", or "the thing I selected", read the live cursor the dev server writes:

```bash
cat .opencanva/current.json
```

It contains (best-effort, updated as the user navigates / zooms / selects):

```json
{
  "designId": "summer-sale",
  "title": "Summer Sale",
  "activeBoard": 0,
  "board": "poster",
  "zoom": 0.47,
  "view": "inspect",
  "selection": { "rel": "designs/summer-sale/index.tsx", "line": 14, "column": 4, "tag": "Text" },
  "updatedAt": "2026-06-20T…Z"
}
```

- **`designId`** → the design is `designs/<designId>/index.tsx`.
- **`board`** / **`activeBoard`** → which Scene (artboard) is active — the `id` and its index in the default array.
- **`selection`** (present if the user clicked an object in the inspector) → the exact source file/line/column and the object tag to edit. This is the most precise anchor — go straight there.
- **`view`** → `inspect` (editing) or `view`.

## Workflow

1. `cat .opencanva/current.json`. If missing, the dev server isn't running or the user hasn't opened a design — ask which design they mean.
2. Resolve `designId` (and `selection` / `board`) to a concrete location in `designs/<designId>/`.
3. Hand off: for edits, follow **`canva-authoring`**; for marked comments, **`apply-comments`**.

Treat `current.json` as a hint, not gospel — it reflects the last reported state. If it looks stale or contradicts the user, confirm.
