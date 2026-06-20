/**
 * Dev-time LAYOUT LINT for designs. The inspector frames objects by their
 * declared x/y/w/h and never looks at what actually rendered, so a class of
 * visual defects stays invisible until you eyeball every board. This measures
 * the live DOM (real fonts, colours, stacking) and flags:
 *
 *   - overflow      a child's content spills past the box that contains it
 *   - invisible     text whose colour ~matches the surface behind it (<1.8:1)
 *   - occluded      text covered by a higher OPAQUE shape (box/ellipse/image)
 *   - text-overlap  two different text objects whose glyphs sit on each other
 *   - off-canvas    a text object pushed past the artboard edge
 *
 * Calibrated against a full visual review of the example designs: it deliberately
 * ignores transparent/text coverers, bounding-box overlap in whitespace, layered
 * drop-shadow duplicates, and merely-low (but readable) brand contrast — the
 * false positives a naive geometric checker produces. Surfaced via
 * `window.__ox.lint()` and a console warning on load (see app.tsx).
 */
export type IssueKind = 'overflow' | 'invisible' | 'occluded' | 'text-overlap' | 'off-canvas';

export interface LayoutIssue {
  kind: IssueKind;
  severity: 'high' | 'medium';
  type: string;
  label: string;
  detail: string;
}

const OVERFLOW_PX = 6; // line-box-padding tolerance (artboard px)
const INVISIBLE = 1.8; // contrast at/below this reads as effectively invisible
const OCCLUDED_FRAC = 0.2; // covered fraction that counts as occlusion (catches partial clips)

/* ---- colour / contrast (WCAG relative luminance) ------------------------- */

function parseRgb(s: string): [number, number, number, number] | null {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i.exec(s);
  return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
}
function relLum([r, g, b]: number[]): number {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a: number[], b: number[]): number {
  const la = relLum(a) + 0.05;
  const lb = relLum(b) + 0.05;
  return la > lb ? la / lb : lb / la;
}

/** The solid surface colour painted directly behind an element, or null if it's
 *  a gradient/image (a single-colour contrast check doesn't apply there). */
function surfaceBehind(el: HTMLElement): number[] | null {
  const r = el.getBoundingClientRect();
  const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2) as HTMLElement[];
  for (const e of stack.slice(stack.indexOf(el) + 1)) {
    const cs = getComputedStyle(e);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
    const rgba = parseRgb(cs.backgroundColor);
    if (rgba && rgba[3] >= 0.6) return [rgba[0], rgba[1], rgba[2]];
  }
  return null;
}

/** Is this object something that would actually HIDE text it's painted over? */
function isOpaqueCover(obj: HTMLElement): boolean {
  const t = obj.getAttribute('data-ox-type');
  if (t !== 'box' && t !== 'image' && t !== 'ellipse') return false; // text/line don't hide
  const cs = getComputedStyle(obj);
  if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
  const rgba = parseRgb(cs.backgroundColor);
  return !!rgba && rgba[3] >= 0.6;
}

/** Fraction of a text's area where the topmost painted element is a *higher,
 *  opaque, non-text* object — i.e. genuinely covering the text. Uses real
 *  hit-testing (border-radius-aware), so a circle only counts where it actually
 *  paints, and a transparent text/line sibling never counts. */
function occludedFraction(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return 0;
  let covered = 0;
  let total = 0;
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 4; j++) {
      const x = r.left + (r.width * (i + 0.5)) / 6;
      const y = r.top + (r.height * (j + 0.5)) / 4;
      const top = document.elementFromPoint(x, y) as HTMLElement | null;
      total++;
      if (!top || top === el || el.contains(top) || top.contains(el)) continue;
      const obj = top.closest<HTMLElement>('[data-ox-obj]');
      if (obj && obj !== el && !el.contains(obj) && !obj.contains(el) && isOpaqueCover(obj)) covered++;
    }
  return total ? covered / total : 0;
}

const labelOf = (el: HTMLElement, type: string) =>
  type === 'text' || type === 'icon' ? (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) || type : type;
const rotated = (el: HTMLElement) => /rotate/.test(el.style.transform);
const norm = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/* ---- the lint ------------------------------------------------------------ */

export function findLayoutIssues(root: ParentNode = document): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const canvas = root.querySelector<HTMLElement>('.ox-canvas');
  const zoom = Number(canvas?.getAttribute('data-ox-zoom')) || 1;

  root.querySelectorAll<HTMLElement>('.ox-board').forEach((board) => {
    const objs = [...board.querySelectorAll<HTMLElement>('[data-ox-obj]')];
    const br = board.getBoundingClientRect();

    for (const el of objs) {
      const type = el.getAttribute('data-ox-type') || 'object';
      const label = labelOf(el, type);
      const r = el.getBoundingClientRect();

      // 1) overflow — child content past its parent box
      const parent = el.parentElement?.closest<HTMLElement>('[data-ox-obj]');
      if (parent && parent.getAttribute('data-ox-type') === 'box' && !rotated(el) && !rotated(parent)) {
        const pr = parent.getBoundingClientRect();
        const over = Math.max((r.bottom - pr.bottom) / zoom, (r.right - pr.right) / zoom);
        if (over > OVERFLOW_PX)
          issues.push({ kind: 'overflow', severity: over > 16 ? 'high' : 'medium', type, label, detail: `spills ${Math.round(over)}px past its container` });
      }

      if (type === 'text' || type === 'icon') {
        // 2) invisible — text colour ~matches the surface behind it
        const cs = getComputedStyle(el);
        const color = parseRgb(cs.color);
        const bg = color ? surfaceBehind(el) : null;
        if (color && bg) {
          const ratio = contrast([color[0], color[1], color[2]], bg);
          // Large display type stays legible at lower contrast (and a soft tint is
          // often deliberate), so relax the bar for big text to avoid false alarms.
          const limit = parseFloat(cs.fontSize) >= 60 ? 1.4 : INVISIBLE;
          if (ratio < limit)
            issues.push({ kind: 'invisible', severity: 'high', type, label, detail: `text contrast ${ratio.toFixed(2)}:1 — effectively invisible against its background` });
        }

        // 3) occlusion — covered by a higher opaque shape
        if (!rotated(el)) {
          const frac = occludedFraction(el);
          if (frac >= OCCLUDED_FRAC)
            issues.push({ kind: 'occluded', severity: frac >= 0.5 ? 'high' : 'medium', type, label, detail: `${Math.round(frac * 100)}% hidden behind another shape` });
        }

        // 5) off-canvas
        const out = Math.max(br.left - r.left, br.top - r.top, r.right - br.right, r.bottom - br.bottom) / zoom;
        if (out > 8) issues.push({ kind: 'off-canvas', severity: 'medium', type, label, detail: `extends ${Math.round(out)}px beyond the artboard` });
      }
    }

    // 4) text-over-text — different texts whose glyphs actually overlap (not
    //    whitespace bounding-box clashes, not drop-shadow duplicates).
    const texts = objs.filter((e) => e.getAttribute('data-ox-type') === 'text' && !rotated(e));
    for (let i = 0; i < texts.length; i++)
      for (let k = i + 1; k < texts.length; k++) {
        const a = texts[i].getBoundingClientRect();
        const b = texts[k].getBoundingClientRect();
        if (norm(texts[i]) === norm(texts[k])) continue; // layered shadow duplicate
        const hOv = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const vOv = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (hOv <= 2 || vOv <= 8) continue;
        // The killer false positive is a big headline whose bounding box spans a
        // small badge sitting in whitespace beside it. Real text-on-text collisions
        // (a heading dropping onto the paragraph below) overlap a large fraction of
        // the WIDER text horizontally; a side badge overlaps only a sliver of it.
        const hFrac = hOv / Math.max(a.width, b.width);
        if (hFrac > 0.4)
          issues.push({ kind: 'text-overlap', severity: vOv > 14 ? 'high' : 'medium', type: 'text', label: labelOf(texts[i], 'text'), detail: `overlaps text "${labelOf(texts[k], 'text')}"` });
      }
  });

  return issues;
}

// Back-compat alias (the dev hook + console warning import this).
export const findOverflows = findLayoutIssues;
