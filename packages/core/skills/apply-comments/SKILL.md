---
name: apply-comments
description: Use this skill when the user has left inspector comments on a design and wants them applied — "apply the comments", "do the edits I marked", "make the changes I noted on the canvas". Finds `@canva-comment` markers (and `data-ox-comment` attributes) in `designs/`, applies each requested change, then removes the markers.
---

# Apply inspector comments

The in-browser inspector persists each comment into the source as a marker. This skill finds every pending marker, applies the requested edit following the **`canva-authoring`** rules, and clears the marker.

## Marker grammar

Two forms are written by the inspector:

- On a normal object — a JSX comment as its first child:
  ```tsx
  <Text x={80} y={120} ...>{/* @canva-comment: "make this bigger and orange" */}Big headline</Text>
  ```
- On a self-closing object — a data attribute:
  ```tsx
  <Ellipse x={700} y={-120} ... data-ox-comment="move this off the top edge" />
  ```

Find them all:

```bash
grep -rnE '@canva-comment:|data-ox-comment=' designs/
```

The comment text is the string after `@canva-comment:` (or the `data-ox-comment` value).

## Workflow

1. **Collect** every marker with `grep` (above). Note the file, line, and the object each marker is attached to.
2. **Apply edits bottom-up** — process markers in **descending line order within each file** so earlier edits don't shift later line numbers. For each: read the surrounding code, make the change the comment asks for (consult `canva-authoring` for how — adjust props like `x`/`y`/`w`/`h`/`size`/`fill`/`color`, swap a token, restructure objects), following the design's existing palette and style.
3. **Remove the marker** you just satisfied — delete the `{/* @canva-comment: … */}` child or the `data-ox-comment="…"` attribute.
4. **Verify none remain**:
   ```bash
   grep -rnE '@canva-comment:|data-ox-comment=' designs/ && echo "STILL PENDING" || echo "all clear"
   ```
5. Briefly summarize what you changed per comment. The dev server hot-reloads, so the user sees the result immediately.

Never leave a marker in place after acting on it, and never apply an edit you don't understand — ask instead.
