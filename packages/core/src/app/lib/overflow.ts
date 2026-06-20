/**
 * Dev-time LAYOUT LINT for designs. The inspector frames objects by their
 * declared x/y/w/h and never looks at what actually rendered, so a class of
 * visual defects stays invisible until you eyeball every board. This measures
 * the live DOM (real fonts, colours, stacking) and flags:
 *
 *   - overflow      a child's content spills past the box that contains it
 *   - invisible     text whose colour ~matches the surface behind it (<1.8:1)
 *   - occluded      a higher OPAQUE shape covers the real glyphs of a text line
 *                   (measured per rendered line, so a clipped tail word counts),
 *                   or a LINE rule largely hidden behind opaque shapes (dead rule)
 *   - crowding      a text/figure jammed against the inner edge of a much larger
 *                   container box, with no breathing room (e.g. card-footer text
 *                   touching the card border, a subhead riding the band edge)
 *   - text-overlap  two different text objects whose glyphs sit on each other
 *   - off-canvas    a text object pushed past the artboard edge
 *
 * Calibrated against a full visual review of the example designs: it deliberately
 * ignores transparent/text coverers, bounding-box overlap in whitespace, layered
 * drop-shadow duplicates, and merely-low (but readable) brand contrast — the
 * false positives a naive geometric checker produces. Surfaced via
 * `window.__ox.lint()` and a console warning on load (see app.tsx).
 */
export type IssueKind = 'overflow' | 'invisible' | 'occluded' | 'crowding' | 'text-overlap' | 'off-canvas';

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
const CROWD_RATIO = 3; // container must exceed the element this many times on the crowded axis
const CROWD_MIN = 4; // floor for the required breathing margin (artboard px)
const CROWD_MAX = 10; // cap for the required breathing margin (artboard px)

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

/** An element's own CSS opacity (1 when unset/invalid). primitives.tsx applies
 *  per-object opacity directly, so a solid fill at e.g. opacity 0.2 is see-through
 *  and must not count as an opaque cover / surface / hard edge. */
function elOpacity(cs: CSSStyleDeclaration): number {
  const o = parseFloat(cs.opacity);
  return Number.isNaN(o) ? 1 : o;
}

/** The solid surface colour painted directly behind an element, or null if it's
 *  a gradient/image or nothing solid is found (a single-colour contrast check
 *  doesn't apply there). Effective alpha folds in element opacity, and a faint
 *  layer is skipped so the real surface behind it is measured. */
function surfaceBehind(el: HTMLElement): number[] | null {
  const r = el.getBoundingClientRect();
  const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2) as HTMLElement[];
  const i = stack.indexOf(el);
  if (i < 0) return null; // el isn't hit at its own centre — fail safe instead of scanning layers above it
  for (const e of stack.slice(i + 1)) {
    const cs = getComputedStyle(e);
    const o = elOpacity(cs);
    if (o < 0.1) continue; // fully transparent layer — see through to what's behind
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      if (o >= 0.6) return null; // opaque image/gradient — can't reduce to one colour
      continue;
    }
    const rgba = parseRgb(cs.backgroundColor);
    if (rgba && rgba[3] * o >= 0.6) return [rgba[0], rgba[1], rgba[2]];
  }
  return null;
}

/** Is this object something that would actually HIDE text it's painted over? */
function isOpaqueCover(obj: HTMLElement): boolean {
  const t = obj.getAttribute('data-ox-type');
  if (t !== 'box' && t !== 'image' && t !== 'ellipse') return false; // text/line don't hide
  const cs = getComputedStyle(obj);
  const o = elOpacity(cs);
  if (cs.backgroundImage && cs.backgroundImage !== 'none') return o >= 0.6;
  const rgba = parseRgb(cs.backgroundColor);
  return !!rgba && rgba[3] * o >= 0.6;
}

/** Does a *higher, opaque, non-ancestor* object paint at this screen point?
 *  Real hit-testing (border-radius-aware), so a circle only counts where it
 *  actually paints and a transparent text/line sibling never counts. */
function coveredAt(el: HTMLElement, x: number, y: number): boolean {
  const top = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!top || top === el || el.contains(top) || top.contains(el)) return false;
  const obj = top.closest<HTMLElement>('[data-ox-obj]');
  return !!obj && obj !== el && !el.contains(obj) && !obj.contains(el) && isOpaqueCover(obj);
}

/** Occlusion of a text's ACTUAL glyph runs (one rect per rendered line), not its
 *  declared box. Returns the worst line's covered fraction and covered width in
 *  artboard px. Measuring the real line rects is what catches a clipped word at
 *  the end of a long headline: a tail that's a tiny slice of a wide (or multi-
 *  line) text box but a clearly hidden chunk of real text — the bounding-box grid
 *  diluted that below threshold and missed it. */
function textOcclusion(el: HTMLElement, zoom: number): { frac: number; px: number } {
  let rects: DOMRect[] = [];
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    rects = [...range.getClientRects()].filter((r) => r.width > 4 && r.height > 4);
  } catch {
    return { frac: 0, px: 0 };
  }
  if (!rects.length) {
    const r = el.getBoundingClientRect();
    if (r.width > 4 && r.height > 4) rects = [r];
  }
  let frac = 0;
  let px = 0;
  for (const lr of rects) {
    const y = lr.top + lr.height / 2;
    const n = Math.max(10, Math.min(100, Math.round(lr.width / 6)));
    let covered = 0;
    for (let i = 0; i < n; i++) if (coveredAt(el, lr.left + (lr.width * (i + 0.5)) / n, y)) covered++;
    frac = Math.max(frac, covered / n);
    px = Math.max(px, ((covered / n) * lr.width) / zoom);
  }
  return { frac, px };
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** Tight CONTENT rect (screen px): the union of a text's rendered line rects (so
 *  trailing whitespace in a wide box doesn't count), else the element's bbox. */
function contentRect(el: HTMLElement, type: string): Box {
  if (type === 'text' || type === 'icon') {
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rs = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
      if (rs.length) {
        let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
        for (const x of rs) { l = Math.min(l, x.left); t = Math.min(t, x.top); r = Math.max(r, x.right); b = Math.max(b, x.bottom); }
        return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
      }
    } catch { /* fall through */ }
  }
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
}

/** A RECTANGULAR box that actually paints an edge (border or opaque/​image fill)
 *  — i.e. one whose straight inner edge a crowded element visibly butts against.
 *  Ellipses are excluded: they don't paint in their bbox corners, so bbox-edge
 *  proximity is meaningless (an element near the corner isn't near the shape). */
function isVisibleBox(el: HTMLElement): boolean {
  const t = el.getAttribute('data-ox-type');
  if (t !== 'box' && t !== 'image') return false;
  const cs = getComputedStyle(el);
  const o = elOpacity(cs);
  if (o < 0.6) return false; // too faint to read as a hard container edge
  if (parseFloat(cs.borderTopWidth) > 0.5) return true;
  if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
  const rgba = parseRgb(cs.backgroundColor);
  return !!rgba && rgba[3] * o >= 0.6;
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
    const vboxes = objs.filter(isVisibleBox);

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
        const cs = getComputedStyle(el);
        // 2) invisible — text colour ~matches the surface behind it. Real text only:
        //    an Icon paints via an SVG `fill` or a multicolour emoji glyph, so a
        //    `color`-vs-surface ratio is meaningless and would false-flag.
        if (type === 'text' && !el.querySelector('svg')) {
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
        }

        // 3) occlusion — real glyphs (per line) covered by a higher opaque shape.
        //    Flag on a big covered fraction OR a meaningful absolute width (~half a
        //    character), so a clipped word at a line's leading/trailing edge is
        //    caught even when it's a small slice of a wide or multi-line text box.
        if (!rotated(el)) {
          const { frac, px } = textOcclusion(el, zoom);
          // fontSize is in artboard px already — the zoom is a CSS transform, which
          // doesn't scale computed font-size (unlike getBoundingClientRect widths).
          const fs = parseFloat(cs.fontSize);
          if (frac >= OCCLUDED_FRAC || px >= Math.max(40, fs * 0.5))
            issues.push({ kind: 'occluded', severity: frac >= 0.5 || px >= 120 ? 'high' : 'medium', type, label, detail: `${Math.round(frac * 100)}% of a text line (~${Math.round(px)}px) hidden behind another shape` });
        }

        // 5) off-canvas
        const out = Math.max(br.left - r.left, br.top - r.top, r.right - br.right, r.bottom - br.bottom) / zoom;
        if (out > 8) issues.push({ kind: 'off-canvas', severity: 'medium', type, label, detail: `extends ${Math.round(out)}px beyond the artboard` });
      }

      // 3b) a LINE largely hidden behind opaque shapes — a dead rule (e.g. a
      //     "connector" placed at the card tops that the cards paint right over).
      //     Lines are never offset-shadows, so this stays clean where a box-vs-box
      //     cover check would drown in intentional shadow/overlap false positives.
      if (type === 'line' && !rotated(el) && (r.width >= 8 || r.height >= 8)) {
        const horiz = r.width >= r.height;
        const n = 24;
        let cov = 0;
        for (let i = 0; i < n; i++) {
          const x = horiz ? r.left + (r.width * (i + 0.5)) / n : r.left + r.width / 2;
          const y = horiz ? r.top + r.height / 2 : r.top + (r.height * (i + 0.5)) / n;
          if (coveredAt(el, x, y)) cov++;
        }
        if (cov / n > 0.7)
          issues.push({ kind: 'occluded', severity: 'medium', type, label, detail: `line is ${Math.round((cov / n) * 100)}% hidden behind other shapes — not visible` });
      }

      // 6) crowding — text/figure jammed against the inner edge of a MUCH LARGER
      //    container box. Measured against actual content (glyph rect for text) vs
      //    the container's edge. The "much larger on the crowded axis" gate is what
      //    keeps snug chips/pills/badges (boxes sized to their text) and centred
      //    labels from firing — only an element pushed flat against one edge of a
      //    container with real empty space counts. Ellipses/images are excluded as
      //    the crowded element: they're overwhelmingly decorative dots/blobs that
      //    intentionally kiss an edge (a jammed BOX, e.g. a pill, is the real case).
      if ((type === 'text' || type === 'icon' || type === 'box') && !rotated(el)) {
        const g = contentRect(el, type);
        if (g.width > 2 && g.height > 2) {
          let cr: DOMRect | null = null;
          let ca = Infinity;
          for (const b of vboxes) {
            if (b === el) continue;
            const r2 = b.getBoundingClientRect();
            if (r2.left <= g.left + 2 && r2.top <= g.top + 2 && r2.right >= g.right - 2 && r2.bottom >= g.bottom - 2) {
              const a = r2.width * r2.height;
              if (a > g.width * g.height * 1.05 && a < ca) { cr = r2; ca = a; }
            }
          }
          if (cr) {
            const gaps: Record<string, number> = {
              bottom: (cr.bottom - g.bottom) / zoom,
              top: (g.top - cr.top) / zoom,
              left: (g.left - cr.left) / zoom,
              right: (cr.right - g.right) / zoom,
            };
            let side = 'bottom';
            let min = Infinity;
            for (const k in gaps) if (gaps[k] < min) { min = gaps[k]; side = k; }
            const vert = side === 'top' || side === 'bottom';
            const cExt = (vert ? cr.height : cr.width) / zoom;
            const eExt = (vert ? g.height : g.width) / zoom;
            const fs = parseFloat(getComputedStyle(el).fontSize);
            const limit =
              type === 'text' || type === 'icon'
                ? Math.min(Math.max(0.2 * fs, CROWD_MIN), CROWD_MAX)
                : Math.min(Math.max(0.18 * (Math.min(g.width, g.height) / zoom), CROWD_MIN), CROWD_MAX);
            if (cExt > eExt * CROWD_RATIO && min > 0.5 && min < limit)
              issues.push({ kind: 'crowding', severity: min < 2 ? 'high' : 'medium', type, label, detail: `sits ${Math.round(min)}px from its container's ${side} edge — no breathing room` });
          }
        }
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
