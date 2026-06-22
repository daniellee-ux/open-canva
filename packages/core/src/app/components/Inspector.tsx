import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type CanvaSource, findCanvaSource } from '../lib/fiber';
import { Icon } from './icons';
import { AssetPicker } from './ui/AssetPicker';
import { SelectMenu } from './ui/Menu';
import { toast } from './ui/toast';

/**
 * Click-to-source inspector for the canvas. Resolves the clicked object via its
 * injected `data-ox-loc` on the fiber chain, frames it (fixed positioning,
 * recomputed under zoom/pan), and edits the SOURCE through the dev write-back API:
 *
 *   - drag body         → op:'prop' { x, y }        (screen delta ÷ zoom → artboard px)
 *   - drag a handle     → op:'prop' { x, y, w, h }
 *   - drag rotate knob  → op:'prop' { rotate }
 *   - color / size / B  → op:'prop' { fill | color | size | weight }
 *   - front / back      → op:'prop' { z }
 *   - text box          → op:'text'
 *   - Delete            → op:'remove'
 *   - comment box       → /__ox/comment   (a @canva-comment marker)
 *
 * Edits apply optimistically to the element's inline style during the gesture,
 * then commit once on pointer-up; HMR re-renders from the new source. The single
 * zoom/pan transform lives on `.ox-canvas`, so `getBoundingClientRect` stays
 * correct here; only the drag delta is divided by zoom.
 */

const OBJ = '[data-ox-obj]';
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type Handle = (typeof HANDLES)[number];

type Geom = { x: number; y: number; w: number; h: number; rotate: number };
type Toast = { kind: 'ok' | 'err'; msg: string };
type Sel = { el: HTMLElement; src: CanvaSource | null; type: string };
type MoveTarget = { el: HTMLElement; src: CanvaSource | null; base: Geom };
type Gesture =
  | { mode: 'move'; base: Geom; px: number; py: number; moved: boolean; targets: MoveTarget[]; snap?: { xs: number[]; ys: number[]; rect: DOMRect } }
  | { mode: 'resize'; handle: Handle; base: Geom; px: number; py: number; moved: boolean }
  | { mode: 'rotate'; base: Geom; cx: number; cy: number; startAngle: number; moved: boolean }
  | { mode: 'marquee'; px: number; py: number; moved: boolean; additive: boolean; rect: { x: number; y: number; w: number; h: number } }
  | { mode: 'pan'; px: number; py: number; lastX: number; lastY: number; moved: boolean };

const HANDLE_VEC: Record<Handle, { fx: number; fy: number }> = {
  nw: { fx: -1, fy: -1 }, n: { fx: 0, fy: -1 }, ne: { fx: 1, fy: -1 }, e: { fx: 1, fy: 0 },
  se: { fx: 1, fy: 1 }, s: { fx: 0, fy: 1 }, sw: { fx: -1, fy: 1 }, w: { fx: -1, fy: 0 },
};

async function post(url: string, body?: unknown): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

function readGeom(el: HTMLElement): Geom {
  const num = (a: string, fb: number) => {
    const v = el.getAttribute(a);
    return v == null || v === '' ? fb : Number(v);
  };
  return {
    x: num('data-ox-x', 0),
    y: num('data-ox-y', 0),
    w: num('data-ox-w', el.offsetWidth),
    h: num('data-ox-h', el.offsetHeight),
    rotate: num('data-ox-rotate', 0),
  };
}

/**
 * Geometry the element is ACTUALLY rendering right now: the inline style (which a
 * gesture mutates live) wins over the data-ox-* attributes (which React only
 * rewrites on the next commit/HMR). Without this the selection frame reads a live
 * center from getBoundingClientRect but a stale size/angle from the attributes, so
 * the frame and handles freeze at the pre-drag dimensions during resize/rotate.
 */
function readGeomLive(el: HTMLElement): Geom {
  const g = readGeom(el);
  const num = (v: string) => (v ? Number.parseFloat(v) : Number.NaN);
  const sw = num(el.style.width);
  const sh = num(el.style.height);
  const rot = /rotate\(([-\d.]+)deg\)/.exec(el.style.transform || '');
  return {
    ...g,
    w: Number.isFinite(sw) ? sw : g.w,
    h: Number.isFinite(sh) ? sh : g.h,
    rotate: rot ? Number(rot[1]) : g.rotate,
  };
}

/** Theme swatches: the source TOKEN to write, plus the CSS var to read for display. */
const SWATCHES: { token: string; key: string }[] = [
  { token: 'var(--ox-accent)', key: '--ox-accent' },
  { token: 'var(--ox-accent2)', key: '--ox-accent2' },
  { token: 'var(--ox-fg)', key: '--ox-fg' },
  { token: 'var(--ox-bg)', key: '--ox-bg' },
  { token: 'var(--ox-surface)', key: '--ox-surface' },
];

function rgbToHex(raw: string): string {
  const s = raw.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(s)) return s;
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(s);
  if (!m) return '#000000';
  return `#${[1, 2, 3].map((i) => Math.round(Number(m[i])).toString(16).padStart(2, '0')).join('')}`;
}

/** Resolve a CSS var as it computes ON THE OBJECT (inside the themed board). */
function resolveVar(el: HTMLElement, name: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v ? rgbToHex(v) : '#888888';
}

/** The object's current fill/text color, as a hex the native picker can show. */
function currentColorOf(el: HTMLElement, prop: 'color' | 'fill'): string {
  const cs = getComputedStyle(el);
  return rgbToHex(prop === 'color' ? cs.color : cs.backgroundColor);
}

/** Live typography readout for the Type controls (read off the rendered object). */
type TypeStyle = {
  size: number;
  weight: number;
  italic: boolean;
  uppercase: boolean;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
};

const WEIGHTS: { v: number; label: string }[] = [
  { v: 100, label: 'Thin' },
  { v: 300, label: 'Light' },
  { v: 400, label: 'Regular' },
  { v: 500, label: 'Medium' },
  { v: 600, label: 'Semibold' },
  { v: 700, label: 'Bold' },
  { v: 800, label: 'Extrabold' },
  { v: 900, label: 'Black' },
];

/** Read the object's current typography as the inspector controls model it.
 *  lineHeight is normalized to the unitless multiple the `Text` primitive uses. */
function readTypeStyle(el: HTMLElement): TypeStyle {
  const cs = getComputedStyle(el);
  const size = Math.round(Number.parseFloat(cs.fontSize) || 48);
  const lhPx = cs.lineHeight === 'normal' ? size * 1.2 : Number.parseFloat(cs.lineHeight) || size * 1.2;
  const ls = cs.letterSpacing === 'normal' ? 0 : Number.parseFloat(cs.letterSpacing) || 0;
  return {
    size,
    weight: Number.parseInt(cs.fontWeight, 10) || 400,
    italic: cs.fontStyle.startsWith('italic') || cs.fontStyle.startsWith('oblique'),
    uppercase: cs.textTransform === 'uppercase',
    align: cs.textAlign === 'right' ? 'right' : cs.textAlign === 'center' ? 'center' : 'left',
    lineHeight: Math.round((lhPx / size) * 100) / 100,
    letterSpacing: Math.round(ls * 10) / 10,
  };
}

/** A selection box in screen px that hugs the object even when it's rotated. */
type SelBox = { cx: number; cy: number; w: number; h: number; rotate: number };

function boxOf(el: HTMLElement, zoom: number): { rect: DOMRect; box: SelBox } {
  const rect = el.getBoundingClientRect();
  // Live geometry (inline style), so the frame tracks the object DURING a
  // resize/rotate gesture instead of freezing at the pre-drag size/angle.
  const g = readGeomLive(el);
  // rotation pivots about the object's center, so the AABB center IS the center.
  return {
    rect,
    box: { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, w: g.w * zoom, h: g.h * zoom, rotate: g.rotate },
  };
}

const SNAP_PX = 6; // screen-px threshold for snapping a dragged edge/center to a guide

/** Screen-space snap lines from the board edges/center + every sibling object's
 *  edges/centers (skipping the dragged element and its ancestors/descendants). */
function collectSnapLines(movingEl: HTMLElement): { xs: number[]; ys: number[] } {
  const xs = new Set<number>();
  const ys = new Set<number>();
  const board = movingEl.closest('[data-ox-board]');
  if (board) {
    const b = board.getBoundingClientRect();
    xs.add(b.left).add(b.left + b.width / 2).add(b.right);
    ys.add(b.top).add(b.top + b.height / 2).add(b.bottom);
    for (const el of board.querySelectorAll<HTMLElement>('[data-ox-obj]')) {
      if (el === movingEl || movingEl.contains(el) || el.contains(movingEl)) continue;
      const r = el.getBoundingClientRect();
      xs.add(r.left).add(r.left + r.width / 2).add(r.right);
      ys.add(r.top).add(r.top + r.height / 2).add(r.bottom);
    }
  }
  return { xs: [...xs], ys: [...ys] };
}

/** Best snap offset (screen px) for a set of candidate edge positions vs guide lines. */
function bestSnap(cands: number[], lines: number[]): { adj: number; line: number | null } {
  let adj = 0;
  let line: number | null = null;
  let best = SNAP_PX;
  for (const c of cands) {
    for (const g of lines) {
      const d = g - c;
      if (Math.abs(d) < best) {
        best = Math.abs(d);
        adj = d;
        line = g;
      }
    }
  }
  return { adj, line };
}

/** The object's positioning parent (nearest ancestor object — a Group/Box), or
 *  null for a board-root object. `data-ox-x/y` are relative to it, so align /
 *  distribute (which treat x/y as one coordinate space) are only valid when every
 *  selected object shares one parent. */
const parentObjOf = (el: HTMLElement): HTMLElement | null => el.parentElement?.closest<HTMLElement>(OBJ) ?? null;
const oneParent = (els: HTMLElement[]): boolean => {
  const p0 = parentObjOf(els[0]);
  return els.every((el) => parentObjOf(el) === p0);
};

export function Inspector({
  active,
  zoom,
  revision = 0,
  designId,
  activeBoard = 0,
  onSelectionChange,
  panBy,
}: {
  active: boolean;
  zoom: number;
  /** Bumped by the host on every HMR re-render so the inspector can re-bind its
   *  selection to the new DOM node (the old one is detached — trap-adjacent). */
  revision?: number;
  /** Current design id, used to list its pending comment markers for the badges. */
  designId?: string;
  /** The focused board; changing it drops a selection that belongs to another board. */
  activeBoard?: number;
  onSelectionChange?: (src: CanvaSource | null, el: HTMLElement | null) => void;
  /** Pan the viewport by a screen-pixel delta — drives edit-mode drag-to-pan. */
  panBy?: (dx: number, dy: number) => void;
}) {
  const [sel, setSel] = useState<Sel | null>(null);
  // Additional selected objects beyond the primary `sel` (the multi-selection is
  // [sel, ...extra]). Kept separate so all single-select code stays untouched.
  const [extra, setExtra] = useState<Sel[]>([]);
  const [extraBoxes, setExtraBoxes] = useState<SelBox[]>([]);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [selRect, setSelRect] = useState<DOMRect | null>(null);
  const [selBox, setSelBox] = useState<SelBox | null>(null);
  const [hovRect, setHovRect] = useState<DOMRect | null>(null);
  const [hovBox, setHovBox] = useState<SelBox | null>(null);
  const [commentRects, setCommentRects] = useState<{ text: string; rect: DOMRect }[]>([]);
  const [commentNonce, setCommentNonce] = useState(0);
  const [comments, setComments] = useState<{ rel: string; line: number; column?: number; text: string }[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [imagePicker, setImagePicker] = useState(false);
  const commentEls = useRef<{ text: string; el: HTMLElement }[]>([]);
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');
  const commentRef = useRef('');
  commentRef.current = comment; // read latest comment without making it an effect dep
  const [ts, setTs] = useState<TypeStyle | null>(null);
  // One debounce timer per control key (size, lineHeight, …, zoom) so adjusting a
  // second control doesn't cancel the first's pending source write.
  const typeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const commentTextRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  // Keep panBy fresh for the once-bound pointer handlers without re-subscribing.
  const panByRef = useRef(panBy);
  panByRef.current = panBy;
  // Space-held → pan anywhere (even over an object); set by the keyboard listeners.
  const spaceHeld = useRef(false);
  const selRef = useRef<Sel | null>(null);
  const extraRef = useRef<Sel[]>([]);
  extraRef.current = extra;
  const gesture = useRef<Gesture | null>(null);
  const raf = useRef(0);

  const flash = useCallback((t: Toast) => {
    if (t.kind === 'err') toast.err(t.msg);
    else toast.ok(t.msg);
  }, []);

  const reflow = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const s = selRef.current;
      if (!s || !s.el.isConnected) {
        setSelRect(null);
        setSelBox(null);
      } else {
        const { rect, box } = boxOf(s.el, zoomRef.current || 1);
        setSelRect(rect);
        setSelBox(box);
      }
      setExtraBoxes(
        extraRef.current.filter((x) => x.el.isConnected).map((x) => boxOf(x.el, zoomRef.current || 1).box),
      );
      setCommentRects(
        commentEls.current
          .filter((c) => c.el.isConnected)
          .map((c) => ({ text: c.text, rect: c.el.getBoundingClientRect() })),
      );
    });
  }, []);

  // Resolve each pending comment (file:line) to the rendered object nearest that
  // source line, so a badge can sit on it. Comments live in source, not the DOM.
  const resolveComments = useCallback(
    (list: { rel: string; line: number; text: string }[]) => {
      // Scope to the live canvas — LayersPanel thumbnails carry the same data-ox-loc
      // tags, so an unscoped query could pin a comment badge onto a rail thumbnail.
      const canvas = document.querySelector<HTMLElement>('.ox-canvas');
      const objs = [...(canvas ?? document).querySelectorAll<HTMLElement>(OBJ)]
        .map((el) => ({ el, src: findCanvaSource(el) }))
        .filter((o): o is { el: HTMLElement; src: CanvaSource } => !!o.src);
      const resolved: { text: string; el: HTMLElement }[] = [];
      for (const c of list) {
        let best: HTMLElement | null = null;
        let bestD = 6;
        for (const o of objs) {
          if (o.src.rel !== c.rel) continue;
          const d = Math.abs(o.src.line - c.line);
          if (d < bestD) {
            bestD = d;
            best = o.el;
          }
        }
        if (best) resolved.push({ text: c.text, el: best });
      }
      commentEls.current = resolved;
      reflow();
    },
    [reflow],
  );

  // Fetch the design's pending comment markers whenever it changes (HMR/edit).
  useEffect(() => {
    if (!active || !designId) {
      commentEls.current = [];
      setCommentRects([]);
      setComments([]);
      return;
    }
    let alive = true;
    fetch(`/__ox/comments?design=${encodeURIComponent(designId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        const list = (d.comments ?? []) as { rel: string; line: number; column?: number; text: string }[];
        setComments(list);
        resolveComments(list);
        // Comments arrive async; if the panel is already open on a commented
        // object and the user hasn't started typing, surface the stored text.
        const s = selRef.current;
        if (s && !commentRef.current) {
          const hit = commentEls.current.find((c) => c.el === s.el);
          if (hit) setComment(hit.text);
        }
      })
      // Don't swallow: a failed load is a real signal while authoring comments.
      .catch((err) => {
        if (alive) console.error('[opencanva] failed to load comments', err);
      });
    return () => {
      alive = false;
    };
  }, [active, designId, revision, commentNonce, resolveComments]);

  // An object's existing agent comment, resolved from /__ox/comments. The marker
  // lives in source — a primitive drops a written data-ox-comment prop so it never
  // reaches the DOM, so commentEls (the resolved endpoint data) is the source of
  // truth; getAttribute is only a fallback for raw host nodes.
  const existingCommentFor = useCallback((el: HTMLElement): string => {
    const hit = commentEls.current.find((c) => c.el === el);
    if (hit) return hit.text;
    return el.getAttribute('data-ox-comment') ?? '';
  }, []);

  const select = useCallback(
    (el: HTMLElement) => {
      const src = findCanvaSource(el);
      const next: Sel = { el, src, type: el.getAttribute('data-ox-type') ?? 'object' };
      selRef.current = next;
      setSel(next);
      extraRef.current = [];
      setExtra([]); // a plain click is a fresh single selection
      const { rect, box } = boxOf(el, zoomRef.current || 1);
      setSelRect(rect);
      setSelBox(box);
      setHovRect(null);
      setHovBox(null);
      setText((el.textContent ?? '').replace(/\s+/g, ' ').trim());
      setComment(existingCommentFor(el)); // pre-fill so a left comment is viewable
      onSelectionChange?.(src, el);
    },
    [onSelectionChange, existingCommentFor],
  );

  // Shift/⌘-click toggle: add an object to (or remove it from) the multi-selection.
  const toggleInSelection = useCallback(
    (el: HTMLElement) => {
      const primary = selRef.current;
      if (!primary) {
        select(el);
        return;
      }
      if (primary.el === el) return; // primary stays primary
      const exists = extraRef.current.some((s) => s.el === el);
      const nextExtra = exists
        ? extraRef.current.filter((s) => s.el !== el)
        : [...extraRef.current, { el, src: findCanvaSource(el), type: el.getAttribute('data-ox-type') ?? 'object' }];
      extraRef.current = nextExtra;
      setExtra(nextExtra);
      reflow();
    },
    [select, reflow],
  );

  // Set the whole selection at once (used by marquee). First item is the primary.
  const applySelection = useCallback(
    (list: Sel[]) => {
      if (!list.length) {
        selRef.current = null;
        extraRef.current = [];
        setSel(null);
        setExtra([]);
        setExtraBoxes([]);
        setSelRect(null);
        setSelBox(null);
        onSelectionChange?.(null, null);
        return;
      }
      const [first, ...rest] = list;
      selRef.current = first;
      extraRef.current = rest;
      setSel(first);
      setExtra(rest);
      setText((first.el.textContent ?? '').replace(/\s+/g, ' ').trim());
      setComment(existingCommentFor(first.el));
      const { rect, box } = boxOf(first.el, zoomRef.current || 1);
      setSelRect(rect);
      setSelBox(box);
      setHovRect(null);
      setHovBox(null);
      onSelectionChange?.(first.src, first.el);
      reflow();
    },
    [existingCommentFor, onSelectionChange, reflow],
  );

  const deselect = useCallback(() => {
    selRef.current = null;
    extraRef.current = [];
    setSel(null);
    setExtra([]);
    setExtraBoxes([]);
    setSelRect(null);
    setSelBox(null);
    onSelectionChange?.(null, null);
  }, [onSelectionChange]);

  // Jump from a comments-panel row to the object it annotates (select + center).
  const focusComment = useCallback(
    (c: { text: string }) => {
      const hit = commentEls.current.find((x) => x.text === c.text);
      if (hit?.el.isConnected) {
        select(hit.el);
        hit.el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      }
    },
    [select],
  );

  const commitProps = useCallback(
    async (props: Record<string, number | string | boolean>, label: string, srcOverride?: CanvaSource | null) => {
      // Default to the live selection, but allow a captured target so a debounced
      // write lands on the object that was edited, not whatever is selected now.
      const src = srcOverride ?? selRef.current?.src;
      if (!src) return;
      try {
        await post('/__ox/edit', {
          rel: src.rel, line: src.line, column: src.column, op: 'prop', payload: { props },
        });
        setCanUndo(true);
        setCanRedo(false);
      } catch (err) {
        flash({ kind: 'err', msg: `${label}: ${String((err as Error).message ?? err)}` });
      }
    },
    [flash],
  );

  // One write for many objects (multi-move, align, distribute, multi-delete) —
  // a single undo entry + a single HMR reload. `edits` are full {rel,line,column,op,payload}.
  const commitBatch = useCallback(
    async (edits: unknown[], label: string) => {
      if (!edits.length) return;
      try {
        const data = await post('/__ox/edit-batch', { edits });
        // Some selected objects can share one source element (siblings from a .map);
        // those edits collapse server-side. Surface it so a partial move isn't silent.
        if (data?.dropped > 0) flash({ kind: 'err', msg: `${label}: ${data.dropped} skipped — objects share one source element` });
        setCanUndo(true);
        setCanRedo(false);
      } catch (err) {
        flash({ kind: 'err', msg: `${label}: ${String((err as Error).message ?? err)}` });
      }
    },
    [flash],
  );

  // Keep the Type controls mirroring the selected object's rendered typography —
  // recomputed on (re)select and after every HMR re-render (revision bump).
  useEffect(() => {
    const s = selRef.current;
    setTs(s && (s.type === 'text' || s.type === 'icon') ? readTypeStyle(s.el) : null);
  }, [sel, revision]);

  // One handler for every Type control: optimistic local state + inline-style
  // preview (so sliders feel live), then commit the prop to source. Slider drags
  // debounce so the OS doesn't spam writes; toggles/selects commit immediately.
  const editType = useCallback(
    (key: keyof TypeStyle, value: number | string | boolean, css: Record<string, string>, debounce = false) => {
      const s = selRef.current;
      if (!s) return;
      const src = s.src; // capture the target so a debounced write can't drift to a new selection
      setTs((prev) => (prev ? { ...prev, [key]: value } : prev));
      for (const [k, v] of Object.entries(css)) s.el.style.setProperty(k, v);
      const run = () => void commitProps({ [key]: value }, 'Type', src);
      if (debounce) {
        const k = String(key);
        if (typeTimers.current[k]) clearTimeout(typeTimers.current[k]);
        typeTimers.current[k] = setTimeout(run, 200);
      } else run();
    },
    [commitProps],
  );

  /* ----- one unified gesture engine ---------------------------------------- */

  const onGesturePointerMove = useCallback(
    (e: PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      const z = zoomRef.current || 1;

      if (g.mode === 'marquee') {
        g.moved = true;
        const r = {
          x: Math.min(e.clientX, g.px),
          y: Math.min(e.clientY, g.py),
          w: Math.abs(e.clientX - g.px),
          h: Math.abs(e.clientY - g.py),
        };
        g.rect = r; // stored on the gesture so pointer-up reads a fresh rect
        setMarquee(r);
        return;
      }

      if (g.mode === 'pan') {
        if (!g.moved && Math.abs(e.clientX - g.px) + Math.abs(e.clientY - g.py) < 3) return;
        g.moved = true;
        panByRef.current?.(e.clientX - g.lastX, e.clientY - g.lastY); // screen-space delta
        g.lastX = e.clientX;
        g.lastY = e.clientY;
        reflow(); // re-place selection/hover frames as the canvas slides under them
        return;
      }

      const s = selRef.current;
      if (!s) return;

      if (g.mode === 'rotate') {
        g.moved = true;
        const ang = (Math.atan2(e.clientY - g.cy, e.clientX - g.cx) - g.startAngle) * (180 / Math.PI);
        let deg = g.base.rotate + ang;
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        s.el.style.transform = `rotate(${Math.round(deg)}deg)`;
        reflow();
        return;
      }

      const dx = (e.clientX - g.px) / z;
      const dy = (e.clientY - g.py) / z;

      if (g.mode === 'move') {
        if (!g.moved && Math.abs(e.clientX - g.px) + Math.abs(e.clientY - g.py) < 3) return;
        g.moved = true;
        let ddx = dx;
        let ddy = dy;
        if (e.shiftKey) {
          Math.abs(dx) > Math.abs(dy) ? (ddy = 0) : (ddx = 0); // axis-lock
        } else if (g.targets.length === 1 && g.snap) {
          // Snap the dragged object's edges/center to board + sibling guide lines.
          const r = g.snap.rect;
          const sdx = ddx * z;
          const sdy = ddy * z;
          const sx = bestSnap([r.left + sdx, r.left + r.width / 2 + sdx, r.right + sdx], g.snap.xs);
          const sy = bestSnap([r.top + sdy, r.top + r.height / 2 + sdy, r.bottom + sdy], g.snap.ys);
          if (sx.line != null) ddx += sx.adj / z;
          if (sy.line != null) ddy += sy.adj / z;
          setGuides({ x: sx.line != null ? [sx.line] : [], y: sy.line != null ? [sy.line] : [] });
        }
        // Move every selected object by the same artboard-space delta.
        for (const t of g.targets) {
          t.el.style.left = `${Math.round(t.base.x + ddx)}px`;
          t.el.style.top = `${Math.round(t.base.y + ddy)}px`;
        }
      } else {
        // Resize. Works for rotated objects: project the screen delta onto the
        // object's local axes, then keep the anchor (edge/corner opposite the
        // handle) fixed in artboard space while re-deriving the center.
        g.moved = true;
        const v = HANDLE_VEC[g.handle];
        const th = ((g.base.rotate || 0) * Math.PI) / 180;
        const cos = Math.cos(th);
        const sin = Math.sin(th);
        const lx = dx * cos + dy * sin; // R(-θ)·delta
        const ly = -dx * sin + dy * cos;
        const w = Math.max(4, g.base.w + v.fx * lx);
        const h = Math.max(4, g.base.h + v.fy * ly);
        const c0x = g.base.x + g.base.w / 2;
        const c0y = g.base.y + g.base.h / 2;
        const a0x = (-v.fx * g.base.w) / 2;
        const a0y = (-v.fy * g.base.h) / 2;
        const anchorX = c0x + (a0x * cos - a0y * sin);
        const anchorY = c0y + (a0x * sin + a0y * cos);
        const a1x = (-v.fx * w) / 2;
        const a1y = (-v.fy * h) / 2;
        const cx = anchorX - (a1x * cos - a1y * sin);
        const cy = anchorY - (a1x * sin + a1y * cos);
        s.el.style.left = `${Math.round(cx - w / 2)}px`;
        s.el.style.top = `${Math.round(cy - h / 2)}px`;
        s.el.style.width = `${Math.round(w)}px`;
        s.el.style.height = `${Math.round(h)}px`;
      }
      reflow();
    },
    [reflow],
  );

  const onGesturePointerUp = useCallback(async () => {
    const g = gesture.current;
    gesture.current = null;
    window.removeEventListener('pointermove', onGesturePointerMove);
    window.removeEventListener('pointerup', onGesturePointerUp);
    window.removeEventListener('pointercancel', onGesturePointerUp);
    setGuides({ x: [], y: [] });
    if (!g) return;

    // Marquee: select every object the box touched (outermost only, so a group
    // wins over its children). A click with no drag clears the selection.
    if (g.mode === 'marquee') {
      const box = g.rect; // read off the gesture (fresh), not stale `marquee` state
      setMarquee(null);
      if (!g.moved || !box || (box.w < 3 && box.h < 3)) {
        if (!g.additive) deselect();
        return;
      }
      const canvas = document.querySelector<HTMLElement>('.ox-canvas');
      const inBox = (r: DOMRect) => r.left < box.x + box.w && r.right > box.x && r.top < box.y + box.h && r.bottom > box.y;
      let hits = [...document.querySelectorAll<HTMLElement>(OBJ)].filter((el) => canvas?.contains(el) && inBox(el.getBoundingClientRect()));
      hits = hits.filter((el) => !hits.some((o) => o !== el && o.contains(el))); // drop nested children
      const toSel = (el: HTMLElement): Sel => ({ el, src: findCanvaSource(el), type: el.getAttribute('data-ox-type') ?? 'object' });
      if (g.additive && selRef.current) {
        const seen = new Set([selRef.current.el, ...extraRef.current.map((x) => x.el)]);
        applySelection([selRef.current, ...extraRef.current, ...hits.filter((el) => !seen.has(el)).map(toSel)]);
      } else {
        applySelection(hits.map(toSel));
      }
      return;
    }

    if (g.mode === 'pan') {
      document.querySelector('.ox-canvas')?.classList.remove('ox-grabbing');
      if (!g.moved) deselect(); // a click with no drag clears the selection
      return;
    }

    const s = selRef.current;
    if (!s || !g.moved) return;
    const live = readGeomFromStyle(s.el, g.base);
    if (g.mode === 'move') {
      if (g.targets.length > 1) {
        const edits = g.targets
          .filter((t) => t.src)
          .map((t) => {
            const lv = readGeomFromStyle(t.el, t.base);
            return { rel: t.src?.rel, line: t.src?.line, column: t.src?.column, op: 'prop', payload: { props: { x: lv.x, y: lv.y } } };
          });
        await commitBatch(edits, 'Move');
      } else {
        await commitProps({ x: live.x, y: live.y }, 'Move');
      }
    } else if (g.mode === 'resize') {
      // Commit only the dimensions the handle actually changed — so a width-only
      // drag never freezes an auto-height <Text> by injecting an h prop.
      const v = HANDLE_VEC[g.handle];
      const props: Record<string, number> = {};
      if (v.fx !== 0) props.w = live.w;
      if (v.fy !== 0) props.h = live.h;
      if (live.x !== g.base.x) props.x = live.x;
      if (live.y !== g.base.y) props.y = live.y;
      if (Object.keys(props).length) await commitProps(props, 'Resize');
    } else {
      await commitProps({ rotate: live.rotate }, 'Rotate');
    }
  }, [commitProps, commitBatch, deselect, applySelection, onGesturePointerMove]);

  const beginGesture = useCallback(
    (g: Gesture) => {
      gesture.current = g;
      window.addEventListener('pointermove', onGesturePointerMove);
      window.addEventListener('pointerup', onGesturePointerUp);
      // pointercancel fires instead of pointerup when the browser/OS steals the
      // pointer; route it through the same commit-and-cleanup path (no leaks).
      window.addEventListener('pointercancel', onGesturePointerUp);
    },
    [onGesturePointerMove, onGesturePointerUp],
  );

  /* ----- hover / select / keyboard, attached while active ------------------ */

  useEffect(() => {
    if (!active) {
      deselect();
      setHovRect(null);
      setHovBox(null);
      return;
    }
    const canvas = document.querySelector<HTMLElement>('.ox-canvas');
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      if (gesture.current) return;
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(OBJ);
      if (!el || !canvas.contains(el)) {
        setHovRect(null);
        setHovBox(null);
        return;
      }
      const { rect, box } = boxOf(el, zoomRef.current || 1);
      setHovRect(rect);
      setHovBox(box);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.altKey) return; // alt/middle fall through to the stage pan handler
      // Space+drag pans anywhere — even over an object — so a dense or full-bleed
      // design is still navigable. Stop here so the stage handler doesn't double-pan.
      if (spaceHeld.current) {
        e.preventDefault();
        e.stopPropagation();
        canvas.classList.add('ox-grabbing');
        beginGesture({ mode: 'pan', px: e.clientX, py: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false });
        return;
      }
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(OBJ);
      const mod = e.shiftKey || e.metaKey || e.ctrlKey;
      if (!el || !canvas.contains(el)) {
        // Empty canvas. Stop here so the stage's pan handler doesn't also fire.
        e.preventDefault();
        e.stopPropagation();
        if (mod) {
          // Shift/⌘-drag → additive marquee box-select.
          beginGesture({ mode: 'marquee', px: e.clientX, py: e.clientY, moved: false, additive: mod, rect: { x: e.clientX, y: e.clientY, w: 0, h: 0 } });
        } else {
          // Plain drag → pan the view (a click with no drag deselects). This is the
          // primary way to pan while editing, since the board often fills the viewport.
          canvas.classList.add('ox-grabbing');
          beginGesture({ mode: 'pan', px: e.clientX, py: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false });
        }
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (mod) {
        toggleInSelection(el); // shift/⌘-click toggles membership, no drag
        return;
      }
      const inSelection = selRef.current?.el === el || extraRef.current.some((x) => x.el === el);
      if (!inSelection) select(el); // clicking outside the selection starts fresh
      const sels = selRef.current ? [selRef.current, ...extraRef.current] : [];
      const targets = sels.map((x) => ({ el: x.el, src: x.src, base: readGeom(x.el) }));
      // Snap guides only for a lone, UNROTATED object: snapping compares
      // getBoundingClientRect edges, whose AABB doesn't match a rotated object's
      // visual edges (multi-move keeps relative spacing, so it skips snapping too).
      const snap =
        targets.length === 1 && readGeom(el).rotate === 0
          ? { ...collectSnapLines(el), rect: el.getBoundingClientRect() }
          : undefined;
      beginGesture({ mode: 'move', base: readGeom(el), px: e.clientX, py: e.clientY, moved: false, targets, snap });
    };
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      const mod = e.metaKey || e.ctrlKey;
      // Source-level undo/redo (Cmd/Ctrl+Z, Shift to redo; Ctrl+Y on Windows).
      // Not while typing in a field — leave the browser's native text undo alone.
      if (mod && !typing && e.key.toLowerCase() === 'z') { e.preventDefault(); void historyRef.current(e.shiftKey ? 'redo' : 'undo'); return; }
      if (mod && !typing && e.key.toLowerCase() === 'y') { e.preventDefault(); void historyRef.current('redo'); return; }
      const s = selRef.current;
      if (!s) return;
      // Cmd/Ctrl+/ jumps to the agent-comment composer for the selection.
      if (mod && e.key === '/') { e.preventDefault(); commentTextRef.current?.focus(); return; }
      if (typing) return;
      if (e.key === 'Escape') return deselect();
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return void removeSelectedRef.current?.(); }
      const step = e.shiftKey ? 10 : 1;
      const d =
        e.key === 'ArrowLeft' ? [-step, 0]
        : e.key === 'ArrowRight' ? [step, 0]
        : e.key === 'ArrowUp' ? [0, -step]
        : e.key === 'ArrowDown' ? [0, step]
        : null;
      if (!d) return;
      e.preventDefault();
      const all = [s, ...extraRef.current].filter((x) => x.src);
      if (all.length > 1) {
        void commitBatch(
          all.map((x) => {
            const g = readGeom(x.el);
            return { rel: x.src?.rel, line: x.src?.line, column: x.src?.column, op: 'prop', payload: { props: { x: g.x + d[0], y: g.y + d[1] } } };
          }),
          'Nudge',
        );
      } else {
        const b = readGeom(s.el);
        void commitProps(d[0] ? { x: b.x + d[0] } : { y: b.y + d[1] }, 'Nudge');
      }
    };

    // Hold Space to pan anywhere (Figma-style). Tracked here so onDown can branch;
    // ignored while typing so Space still types in inputs. Cleared on blur so the
    // "held" state can't get stuck if focus leaves mid-press.
    const onSpace = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const held = e.type === 'keydown';
      if (spaceHeld.current === held) return;
      spaceHeld.current = held;
      canvas.classList.toggle('ox-canvas--grab', held);
    };
    const onBlur = () => {
      spaceHeld.current = false;
      canvas.classList.remove('ox-canvas--grab');
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', reflow, true);
    window.addEventListener('resize', reflow);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keydown', onSpace);
    window.addEventListener('keyup', onSpace);
    window.addEventListener('blur', onBlur);
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', reflow, true);
      window.removeEventListener('resize', reflow);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', onSpace);
      window.removeEventListener('keyup', onSpace);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pointermove', onGesturePointerMove);
      window.removeEventListener('pointerup', onGesturePointerUp);
      window.removeEventListener('pointercancel', onGesturePointerUp);
      cancelAnimationFrame(raf.current);
      spaceHeld.current = false;
      canvas.classList.remove('ox-canvas--grab', 'ox-grabbing');
    };
  }, [active, deselect, select, toggleInSelection, reflow, beginGesture, commitProps, commitBatch, onGesturePointerMove, onGesturePointerUp]);

  // Reframe when the canvas transform changes.
  useEffect(reflow, [zoom, reflow]);

  // Drop the selection when the focused board changes — a selection on the board
  // you just left would otherwise keep receiving nudges/edits invisibly.
  const boardRef = useRef(activeBoard);
  useEffect(() => {
    if (boardRef.current !== activeBoard) {
      boardRef.current = activeBoard;
      deselect();
    }
  }, [activeBoard, deselect]);

  // After an HMR re-render (revision bumps), the previously selected DOM node has
  // been replaced. Re-bind the selection to the new node at the same source
  // location so the frame keeps tracking the object across edits.
  useEffect(() => {
    const s = selRef.current;
    if (!s) return;
    // Scope to the live canvas — LayersPanel thumbnails carry the same data-ox-loc
    // tags and sit before Stage in the DOM, so a global scan would rebind onto a
    // scaled thumbnail (breaking the getBoundingClientRect math).
    const canvas = document.querySelector<HTMLElement>('.ox-canvas');
    const connected = (el: HTMLElement) => el.isConnected && (!canvas || canvas.contains(el));
    // Fast path: nothing detached (a prop-only HMR reused the nodes) → just reflow.
    if (connected(s.el) && extraRef.current.every((x) => connected(x.el))) {
      reflow();
      return;
    }
    // Otherwise re-resolve the primary AND every extra to the freshly-mounted node
    // at the same source location; an extra left detached would feed align/nudge
    // stale geometry, silently mis-positioning it.
    const pool = [...(canvas ?? document).querySelectorAll<HTMLElement>(OBJ)];
    const rebind = (sel: Sel): Sel | null => {
      if (connected(sel.el)) return sel;
      const want = sel.src;
      if (!want) return null;
      const el = pool.find((node) => {
        const src = findCanvaSource(node);
        return !!src && src.rel === want.rel && src.line === want.line && src.column === want.column;
      });
      return el ? { ...sel, el } : null;
    };
    const primary = rebind(s);
    if (!primary) {
      deselect();
      return;
    }
    const nextExtra = extraRef.current.map(rebind).filter((x): x is Sel => !!x);
    selRef.current = primary;
    extraRef.current = nextExtra;
    setSel(primary);
    setExtra(nextExtra);
    // Refresh the popover fields from the freshly-mounted node, so an external edit
    // (e.g. apply-comments rewriting a <Text>) isn't overwritten by a stale Save.
    // But never clobber a field the user is actively typing in — an HMR triggered by
    // a sibling control (size slider, color swatch) bumps revision mid-edit too.
    if (textAreaRef.current !== document.activeElement) {
      setText((primary.el.textContent ?? '').replace(/\s+/g, ' ').trim());
    }
    if (commentTextRef.current !== document.activeElement) {
      setComment(existingCommentFor(primary.el));
    }
    onSelectionChange?.(primary.src, primary.el); // keep the layers-panel highlight bound to the new node
    reflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  /* ----- handle-started gestures ------------------------------------------- */

  const startResize = useCallback(
    (e: React.PointerEvent, handle: Handle) => {
      const s = selRef.current;
      if (!s) return;
      e.preventDefault();
      e.stopPropagation();
      beginGesture({ mode: 'resize', handle, base: readGeom(s.el), px: e.clientX, py: e.clientY, moved: false });
    },
    [beginGesture],
  );

  const startRotate = useCallback(
    (e: React.PointerEvent) => {
      const s = selRef.current;
      if (!s) return;
      e.preventDefault();
      e.stopPropagation();
      const r = s.el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      beginGesture({ mode: 'rotate', base: readGeom(s.el), cx, cy, startAngle: Math.atan2(e.clientY - cy, e.clientX - cx), moved: false });
    },
    [beginGesture],
  );

  /* ----- discrete edits ---------------------------------------------------- */

  const fillProp = sel?.type === 'text' || sel?.type === 'line' || sel?.type === 'icon' ? 'color' : 'fill';
  // The object's current fill/text color, resolved each render from the live DOM.
  const currentColor = sel ? currentColorOf(sel.el, fillProp) : '#000000';
  // Keep the custom-color input mirroring the object's CURRENT color (e.g. after a
  // preset swatch), but never while the user is actively using the OS color panel
  // (that would reset it mid-pick) — so it stays a true reflection, not just the
  // value at selection time.
  const colorInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = colorInputRef.current;
    if (el && document.activeElement !== el) el.value = currentColor;
  }, [currentColor]);

  const setColor = useCallback(
    (color: string) => void commitProps({ [fillProp]: color }, 'Color').then(() => flash({ kind: 'ok', msg: `${fillProp} → ${color}` })),
    [commitProps, fillProp, flash],
  );
  // Live native-picker preview: paint the object immediately, commit to source on
  // a short idle so dragging the OS color panel doesn't spam writes.
  const colorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewColor = useCallback(
    (color: string) => {
      const s = selRef.current;
      if (!s) return;
      if (fillProp === 'color') s.el.style.color = color;
      else s.el.style.background = color;
      if (colorTimer.current) clearTimeout(colorTimer.current);
      colorTimer.current = setTimeout(() => void commitProps({ [fillProp]: color }, 'Color'), 220);
    },
    [fillProp, commitProps],
  );
  const zOrder = useCallback(
    (dir: 'front' | 'back') => void commitProps({ z: dir === 'front' ? 999 : 0 }, 'Order').then(() => flash({ kind: 'ok', msg: dir === 'front' ? 'Brought to front' : 'Sent to back' })),
    [commitProps, flash],
  );
  const saveText = useCallback(async () => {
    const s = selRef.current;
    if (!s?.src) return;
    try {
      await post('/__ox/edit', { rel: s.src.rel, line: s.src.line, column: s.src.column, op: 'text', payload: { text } });
      flash({ kind: 'ok', msg: `Text → ${s.src.rel.split('/').slice(-1)[0]}:${s.src.line}` });
    } catch (err) {
      flash({ kind: 'err', msg: String((err as Error).message ?? err) });
    }
  }, [text, flash]);
  const removeSelected = useCallback(async () => {
    const s = selRef.current;
    if (!s?.src) return;
    const all = [s, ...extraRef.current].filter((x) => x.src);
    try {
      if (all.length > 1) {
        await commitBatch(
          all.map((x) => ({ rel: x.src?.rel, line: x.src?.line, column: x.src?.column, op: 'remove' })),
          'Delete',
        );
        flash({ kind: 'ok', msg: `Deleted ${all.length} objects` });
      } else {
        await post('/__ox/edit', { rel: s.src.rel, line: s.src.line, column: s.src.column, op: 'remove' });
        flash({ kind: 'ok', msg: `Deleted <${s.src.tag}>` });
      }
      deselect();
    } catch (err) {
      flash({ kind: 'err', msg: String((err as Error).message ?? err) });
    }
  }, [flash, deselect, commitBatch]);
  const removeSelectedRef = useRef(removeSelected);
  removeSelectedRef.current = removeSelected;

  const groupSelection = useCallback(async () => {
    const s = selRef.current;
    if (!s?.src) return;
    const all = [s, ...extraRef.current].filter((x) => x.src);
    if (all.length < 2) return;
    const rel = all[0].src?.rel;
    if (all.some((x) => x.src?.rel !== rel)) {
      flash({ kind: 'err', msg: 'Group objects from the same design' });
      return;
    }
    try {
      await post('/__ox/group', { rel, targets: all.map((x) => ({ line: x.src?.line, column: x.src?.column })) });
      flash({ kind: 'ok', msg: `Grouped ${all.length} objects` });
      deselect();
    } catch (err) {
      flash({ kind: 'err', msg: String((err as Error).message ?? err) });
    }
  }, [flash, deselect]);

  const ungroupSelection = useCallback(async () => {
    const s = selRef.current;
    if (!s?.src) return;
    try {
      await post('/__ox/ungroup', { rel: s.src.rel, line: s.src.line, column: s.src.column });
      flash({ kind: 'ok', msg: 'Ungrouped' });
      deselect();
    } catch (err) {
      flash({ kind: 'err', msg: String((err as Error).message ?? err) });
    }
  }, [flash, deselect]);

  // Align every selected object against the selection's shared bounds (one batch).
  type AlignMode = 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom';
  const alignSelection = useCallback(
    (mode: AlignMode) => {
      const all = [selRef.current, ...extraRef.current].filter((x): x is Sel => !!x?.src);
      if (all.length < 2) return;
      // x/y are parent-relative; aligning across parents would compare mismatched
      // origins and write wrong literals. Refuse, mirroring /__ox/group.
      if (!oneParent(all.map((s) => s.el))) {
        flash({ kind: 'err', msg: 'Align objects within the same group' });
        return;
      }
      const items = all.map((s) => ({ s, g: readGeom(s.el) }));
      const minX = Math.min(...items.map((i) => i.g.x));
      const maxR = Math.max(...items.map((i) => i.g.x + i.g.w));
      const minY = Math.min(...items.map((i) => i.g.y));
      const maxB = Math.max(...items.map((i) => i.g.y + i.g.h));
      const cx = (minX + maxR) / 2;
      const cy = (minY + maxB) / 2;
      const edits = items.map(({ s, g }) => {
        const props: Record<string, number> = {};
        if (mode === 'left') props.x = Math.round(minX);
        else if (mode === 'right') props.x = Math.round(maxR - g.w);
        else if (mode === 'centerH') props.x = Math.round(cx - g.w / 2);
        else if (mode === 'top') props.y = Math.round(minY);
        else if (mode === 'bottom') props.y = Math.round(maxB - g.h);
        else props.y = Math.round(cy - g.h / 2);
        return { rel: s.src?.rel, line: s.src?.line, column: s.src?.column, op: 'prop', payload: { props } };
      });
      void commitBatch(edits, 'Align');
    },
    [commitBatch, flash],
  );

  // Even out the spacing of 3+ objects along an axis (one batch).
  const distributeSelection = useCallback(
    (axis: 'h' | 'v') => {
      const all = [selRef.current, ...extraRef.current].filter((x): x is Sel => !!x?.src);
      if (all.length < 3) {
        flash({ kind: 'err', msg: 'Select 3+ objects to distribute' });
        return;
      }
      if (!oneParent(all.map((s) => s.el))) {
        flash({ kind: 'err', msg: 'Distribute objects within the same group' });
        return;
      }
      const pos = axis === 'h' ? 'x' : 'y';
      const size = axis === 'h' ? 'w' : 'h';
      const items = all.map((s) => ({ s, g: readGeom(s.el) })).sort((a, b) => a.g[pos] - b.g[pos]);
      const first = items[0].g[pos];
      const lastItem = items[items.length - 1].g;
      const span = lastItem[pos] + lastItem[size] - first;
      const sumSize = items.reduce((acc, i) => acc + i.g[size], 0);
      const gap = (span - sumSize) / (items.length - 1);
      let cur = first;
      const edits = items.map(({ s, g }) => {
        const p = Math.round(cur);
        cur += g[size] + gap;
        return { rel: s.src?.rel, line: s.src?.line, column: s.src?.column, op: 'prop', payload: { props: { [pos]: p } } };
      });
      void commitBatch(edits, 'Distribute');
    },
    [commitBatch, flash],
  );

  const runComment = useCallback(async () => {
    const s = selRef.current;
    if (!s?.src || !comment.trim()) return;
    try {
      const data = await post('/__ox/comment', { rel: s.src.rel, line: s.src.line, column: s.src.column, text: comment.trim() });
      flash({ kind: 'ok', msg: `Comment → ${data.rel.split('/').slice(-1)[0]}:${data.line}` });
      setComment('');
      setCommentNonce((n) => n + 1);
    } catch (err) {
      flash({ kind: 'err', msg: String((err as Error).message ?? err) });
    }
  }, [comment, flash]);
  const history = useCallback(
    async (dir: 'undo' | 'redo') => {
      try {
        const data = await post(`/__ox/${dir}`);
        if (typeof data.undo === 'number') setCanUndo(data.undo > 0);
        if (typeof data.redo === 'number') setCanRedo(data.redo > 0);
        flash(data.empty ? { kind: 'err', msg: `Nothing to ${dir}` } : { kind: 'ok', msg: `${dir === 'undo' ? 'Undid' : 'Redid'} → ${data.file}` });
      } catch (err) {
        flash({ kind: 'err', msg: String((err as Error).message ?? err) });
      }
    },
    [flash],
  );
  const deleteComment = useCallback(
    async (c: { rel: string; line: number; text: string }) => {
      try {
        const res = await fetch('/__ox/comment', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ rel: c.rel, line: c.line, text: c.text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        setCanUndo(true);
        setCanRedo(false);
        flash({ kind: 'ok', msg: 'Comment deleted' });
        setCommentNonce((n) => n + 1);
      } catch (err) {
        flash({ kind: 'err', msg: String((err as Error).message ?? err) });
      }
    },
    [flash],
  );
  const historyRef = useRef(history);
  historyRef.current = history;

  // Board/token/meta ops (LayersPanel, Tokens panel) write to the SAME undo stack
  // but go through the design API, not the inspector. They broadcast the resulting
  // history depths so the toolbar's Undo/Redo affordance stays in sync (otherwise
  // the button reads disabled even though Cmd+Z would work).
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ undo?: number; redo?: number }>).detail;
      if (typeof d?.undo === 'number') setCanUndo(d.undo > 0);
      if (typeof d?.redo === 'number') setCanRedo(d.redo > 0);
    };
    window.addEventListener('opencanva:history', on);
    return () => window.removeEventListener('opencanva:history', on);
  }, []);

  if (!active) return null;

  const multi = extra.length > 0;
  const frameStyle: React.CSSProperties | null = selBox
    ? {
        left: selBox.cx - selBox.w / 2,
        top: selBox.cy - selBox.h / 2,
        width: selBox.w,
        height: selBox.h,
        transform: `rotate(${selBox.rotate}deg)`,
        transformOrigin: 'center',
      }
    : null;

  // Axis-aligned bounds of the whole multi-selection (for the group frame + toolbar).
  const selBoxesAll = multi && selBox ? [selBox, ...extraBoxes] : [];
  let unionBox: { left: number; top: number; width: number; height: number } | null = null;
  if (selBoxesAll.length) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of selBoxesAll) {
      minX = Math.min(minX, b.cx - b.w / 2);
      minY = Math.min(minY, b.cy - b.h / 2);
      maxX = Math.max(maxX, b.cx + b.w / 2);
      maxY = Math.max(maxY, b.cy + b.h / 2);
    }
    unionBox = { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
  }
  const selCount = selBoxesAll.length;

  // Resolve swatch colors against the SELECTED OBJECT (inside the themed board),
  // since the popover sits outside any [data-ox-board] where the --ox-* vars are unset.
  const swatchColors = sel ? SWATCHES.map((s) => ({ ...s, color: resolveVar(sel.el, s.key) })) : [];
  const norm = (c: string) => c.trim().toLowerCase();
  // A non-text object filled with a gradient/transparent has no single color
  // (computed backgroundColor reads rgba(0,0,0,0)) — don't pretend it's #000000.
  const fillIndeterminate =
    !!sel &&
    fillProp === 'fill' &&
    (() => {
      const cs = getComputedStyle(sel.el);
      return cs.backgroundImage !== 'none' || /,\s*0\)\s*$/.test(cs.backgroundColor);
    })();
  // First preset swatch matching the current color (first-match only, so a color
  // shared by two tokens still highlights a single swatch). -1 = none / custom.
  const selectedSwatchIdx =
    !sel || fillIndeterminate ? -1 : swatchColors.findIndex((s) => norm(s.color) === norm(currentColor));
  const isCustomColor = !!sel && !fillIndeterminate && selectedSwatchIdx === -1;

  // Image reframe state, read off the rendered <img> inside a selected image object.
  const imgEl = sel?.type === 'image' ? sel.el.querySelector<HTMLImageElement>('img') : null;
  const imgFit = imgEl ? imgEl.style.objectFit || getComputedStyle(imgEl).objectFit || 'cover' : 'cover';
  const imgFocus = (imgEl?.style.objectPosition || '50% 50%').replace(/\s+/g, ' ');
  const imgZoom = imgEl ? (Number.parseFloat(imgEl.style.width) || 100) / 100 : 1;
  const FOCAL = ['0% 0%', '50% 0%', '100% 0%', '0% 50%', '50% 50%', '100% 50%', '0% 100%', '50% 100%', '100% 100%'];

  return (
    <div className="ox-inspector-layer">
      {commentRects.map((c, i) => (
        <div
          key={i}
          className="ox-comment-badge"
          style={{ left: c.rect.right - 14, top: c.rect.top - 14 }}
        >
          <Icon name="comment" size={14} />
          <div className="ox-comment-tip">{c.text}</div>
        </div>
      ))}

      {hovBox && hovRect && (!selRect || !sameRect(hovRect, selRect)) ? (
        <div
          className="ox-frame ox-frame--hover"
          style={{
            left: hovBox.cx - hovBox.w / 2,
            top: hovBox.cy - hovBox.h / 2,
            width: hovBox.w,
            height: hovBox.h,
            transform: `rotate(${hovBox.rotate}deg)`,
            transformOrigin: 'center',
          }}
        />
      ) : null}

      {marquee ? (
        <div className="ox-marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
      ) : null}

      {guides.x.map((gx) => (
        <div key={`gx${gx}`} className="ox-guide ox-guide--v" style={{ left: gx }} />
      ))}
      {guides.y.map((gy) => (
        <div key={`gy${gy}`} className="ox-guide ox-guide--h" style={{ top: gy }} />
      ))}

      {multi && unionBox ? (
        <>
          {selBoxesAll.map((b, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: positional outline list
              key={i}
              className="ox-frame ox-frame--multi"
              style={{ left: b.cx - b.w / 2, top: b.cy - b.h / 2, width: b.w, height: b.h, transform: `rotate(${b.rotate}deg)`, transformOrigin: 'center' }}
            />
          ))}
          <div className="ox-frame ox-frame--group" style={{ left: unionBox.left, top: unionBox.top, width: unionBox.width, height: unionBox.height }} />
          <div className="ox-multibar" style={{ left: unionBox.left + unionBox.width / 2, top: Math.max(8, unionBox.top - 50) }}>
            <span className="ox-multibar-count">{selCount}</span>
            <div className="ox-multibar-tools">
              <button type="button" className="ox-multibar-btn" title="Align left" onClick={() => alignSelection('left')}><Icon name="alignLeft" size={15} /></button>
              <button type="button" className="ox-multibar-btn" title="Align horizontal centers" onClick={() => alignSelection('centerH')}><Icon name="alignCenter" size={15} /></button>
              <button type="button" className="ox-multibar-btn" title="Align right" onClick={() => alignSelection('right')}><Icon name="alignRight" size={15} /></button>
              <span className="ox-multibar-sep" />
              <button type="button" className="ox-multibar-btn" title="Align top" onClick={() => alignSelection('top')}><Icon name="alignTop" size={15} /></button>
              <button type="button" className="ox-multibar-btn" title="Align vertical centers" onClick={() => alignSelection('middleV')}><Icon name="alignMiddle" size={15} /></button>
              <button type="button" className="ox-multibar-btn" title="Align bottom" onClick={() => alignSelection('bottom')}><Icon name="alignBottom" size={15} /></button>
              <span className="ox-multibar-sep" />
              <button type="button" className="ox-multibar-btn" title="Distribute horizontally" disabled={selCount < 3} onClick={() => distributeSelection('h')}><Icon name="distH" size={15} /></button>
              <button type="button" className="ox-multibar-btn" title="Distribute vertically" disabled={selCount < 3} onClick={() => distributeSelection('v')}><Icon name="distV" size={15} /></button>
            </div>
            <span className="ox-multibar-sep" />
            <button type="button" className="ox-chip" onClick={() => void groupSelection()}><Icon name="group" size={14} /> Group</button>
            <button type="button" className="ox-chip ox-chip--danger" onClick={() => void removeSelectedRef.current?.()}>Delete</button>
          </div>
        </>
      ) : null}

      {sel && selRect && frameStyle && !multi ? (
        <>
          <div className="ox-frame ox-frame--select" style={frameStyle}>
            <span className="ox-frame-label">{sel.type}{sel.src ? ` · ${sel.src.rel.split('/').slice(-1)[0]}:${sel.src.line}` : ' · unresolved'}</span>
          </div>

          <div className="ox-handles" style={frameStyle}>
            {HANDLES.map((h) => (
              <span key={h} className={`ox-handle ox-handle--${h}`} onPointerDown={(e) => startResize(e, h)} />
            ))}
            <span className="ox-rotate-knob" onPointerDown={startRotate} title="Rotate" />
          </div>

          <Popover rect={selRect}>
            <div className="ox-pop-head">
              <span className="ox-pop-tag">&lt;{sel.src?.tag ?? sel.type}&gt;</span>
              {sel.src ? <span className="ox-pop-loc">{sel.src.rel.split('/').slice(-1)[0]}:{sel.src.line}</span> : <span className="ox-pop-loc ox-pop-loc--miss">unresolved</span>}
            </div>

            {sel.type === 'text' || sel.type === 'icon' ? (
              <>
                <label className="ox-pop-label">Text</label>
                <textarea ref={textAreaRef} className="ox-pop-text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveText(); }} />
                <div className="ox-pop-actions">
                  <button type="button" className="ox-pop-btn ox-pop-btn--primary" disabled={!sel.src} onClick={saveText}>Save text</button>
                </div>

                {ts ? (
                  <>
                    <label className="ox-pop-label">Size <span className="ox-pop-val">{ts.size}px</span></label>
                    <div className="ox-pop-row">
                      <input
                        type="range"
                        className="ox-range"
                        min={8}
                        max={240}
                        step={1}
                        value={ts.size}
                        onChange={(e) => editType('size', Number(e.target.value), { 'font-size': `${e.target.value}px` }, true)}
                      />
                      <input
                        type="number"
                        className="ox-pop-num"
                        min={6}
                        max={400}
                        value={ts.size}
                        onChange={(e) => editType('size', Number(e.target.value), { 'font-size': `${e.target.value}px` }, true)}
                      />
                    </div>

                    {sel.type === 'text' ? (
                      <>
                        <label className="ox-pop-label">Weight &amp; style</label>
                        <div className="ox-pop-row">
                          <SelectMenu
                            label="Font weight"
                            align="start"
                            value={ts.weight}
                            options={WEIGHTS.map((w) => ({ value: w.v, label: w.label }))}
                            onChange={(v) => editType('weight', v, { 'font-weight': String(v) })}
                          />
                          <div className="ox-seg">
                            <button
                              type="button"
                              className={`ox-seg-btn${ts.italic ? ' is-active' : ''}`}
                              title="Italic"
                              aria-pressed={ts.italic}
                              onClick={() => editType('italic', !ts.italic, { 'font-style': ts.italic ? 'normal' : 'italic' })}
                            >
                              <Icon name="italic" size={14} />
                            </button>
                            <button
                              type="button"
                              className={`ox-seg-btn${ts.uppercase ? ' is-active' : ''}`}
                              title="Uppercase"
                              aria-pressed={ts.uppercase}
                              onClick={() => editType('uppercase', !ts.uppercase, { 'text-transform': ts.uppercase ? 'none' : 'uppercase' })}
                            >
                              AA
                            </button>
                          </div>
                        </div>

                        <label className="ox-pop-label">Alignment</label>
                        <div className="ox-seg ox-seg--fill">
                          {(['left', 'center', 'right'] as const).map((a) => (
                            <button
                              key={a}
                              type="button"
                              className={`ox-seg-btn${ts.align === a ? ' is-active' : ''}`}
                              title={`Align ${a}`}
                              aria-pressed={ts.align === a}
                              onClick={() => editType('align', a, { 'text-align': a })}
                            >
                              <Icon name={a === 'left' ? 'alignLeft' : a === 'center' ? 'alignCenter' : 'alignRight'} size={15} />
                            </button>
                          ))}
                        </div>

                        <label className="ox-pop-label">Line height <span className="ox-pop-val">{ts.lineHeight.toFixed(2)}</span></label>
                        <input
                          type="range"
                          className="ox-range"
                          min={0.8}
                          max={2.4}
                          step={0.05}
                          value={ts.lineHeight}
                          onChange={(e) => editType('lineHeight', Number(e.target.value), { 'line-height': e.target.value }, true)}
                        />

                        <label className="ox-pop-label">Letter spacing <span className="ox-pop-val">{ts.letterSpacing}px</span></label>
                        <input
                          type="range"
                          className="ox-range"
                          min={-4}
                          max={20}
                          step={0.5}
                          value={ts.letterSpacing}
                          onChange={(e) => editType('letterSpacing', Number(e.target.value), { 'letter-spacing': `${e.target.value}px` }, true)}
                        />
                      </>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}

            {sel.type === 'image' ? (
              <>
                <label className="ox-pop-label">Image</label>
                <div className="ox-pop-actions">
                  <button type="button" className="ox-pop-btn ox-pop-btn--primary" disabled={!designId} onClick={() => setImagePicker(true)}>
                    <Icon name="image" size={14} /> Replace image
                  </button>
                </div>

                <label className="ox-pop-label">Fit</label>
                <div className="ox-seg ox-seg--fill">
                  {(['cover', 'contain', 'fill'] as const).map((f) => (
                    <button key={f} type="button" className={`ox-seg-btn${imgFit === f ? ' is-active' : ''}`} onClick={() => void commitProps({ fit: f }, 'Fit')}>
                      {f}
                    </button>
                  ))}
                </div>

                <label className="ox-pop-label">Focus</label>
                <div className="ox-focal">
                  {FOCAL.map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      className={`ox-focal-cell${imgFocus === pos ? ' is-active' : ''}`}
                      title={pos}
                      aria-label={`Focus ${pos}`}
                      onClick={() => void commitProps({ focus: pos }, 'Focus')}
                    />
                  ))}
                </div>

                <label className="ox-pop-label">Zoom <span className="ox-pop-val">{imgZoom.toFixed(2)}×</span></label>
                <input
                  type="range"
                  className="ox-range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={imgZoom}
                  onChange={(e) => {
                    const z = Number(e.target.value);
                    if (imgEl) {
                      imgEl.style.width = `${z * 100}%`;
                      imgEl.style.height = `${z * 100}%`;
                    }
                    const src = selRef.current?.src;
                    if (typeTimers.current.zoom) clearTimeout(typeTimers.current.zoom);
                    typeTimers.current.zoom = setTimeout(() => void commitProps({ zoom: z }, 'Zoom', src), 200);
                  }}
                />
              </>
            ) : null}

            <label className="ox-pop-label">{fillProp === 'color' ? 'Color' : 'Fill'}</label>
            <div className="ox-swatches">
              {swatchColors.map((s, i) => {
                const selected = i === selectedSwatchIdx;
                return (
                  <button
                    key={s.token}
                    type="button"
                    className={`ox-swatch${selected ? ' is-selected' : ''}`}
                    title={s.token}
                    aria-label={`${fillProp === 'color' ? 'Text color' : 'Fill'}: ${s.token}`}
                    aria-pressed={selected}
                    style={{ background: s.color }}
                    onClick={() => setColor(s.token)}
                  />
                );
              })}
            </div>
            <label className={`ox-custom${isCustomColor ? ' is-selected' : ''}`} title="Pick any color">
              <span className="ox-custom-tile">
                <input
                  ref={colorInputRef}
                  type="color"
                  className="ox-custom-input"
                  defaultValue={currentColor}
                  aria-label="Custom color"
                  onInput={(e) => previewColor((e.target as HTMLInputElement).value)}
                  onChange={(e) => setColor((e.target as HTMLInputElement).value)}
                />
              </span>
              <span className="ox-custom-text">Custom</span>
              <code className="ox-custom-hex">{fillIndeterminate ? '—' : currentColor}</code>
            </label>

            <label className="ox-pop-label">Arrange</label>
            <div className="ox-pop-actions">
              <button type="button" className="ox-chip" onClick={() => zOrder('front')}>Front</button>
              <button type="button" className="ox-chip" onClick={() => zOrder('back')}>Back</button>
              {sel.type === 'group' ? (
                <button type="button" className="ox-chip" onClick={() => void ungroupSelection()}><Icon name="group" size={14} /> Ungroup</button>
              ) : null}
              <button type="button" className="ox-chip ox-chip--danger" onClick={removeSelected}>Delete</button>
            </div>

            <label className="ox-pop-label">Comment for the agent</label>
            <textarea ref={commentTextRef} className="ox-pop-text" value={comment} placeholder="e.g. “make this headline pop more”" onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runComment(); }} />
            <div className="ox-pop-actions">
              <button type="button" className="ox-pop-btn" onClick={deselect}>Close</button>
              <button type="button" className="ox-pop-btn ox-pop-btn--primary" disabled={!sel.src || !comment.trim()} onClick={runComment}>{existingCommentFor(sel.el) ? 'Update comment' : 'Add comment'}</button>
            </div>
          </Popover>
        </>
      ) : null}

      <div className="ox-inspect-bar">
        <span className="ox-inspect-hint">Click to select · drag canvas (or space-drag) to pan · drag object to move · ⇧/⌘-click or ⇧-drag to multi-select · ⌫ delete · ⌘Z undo</span>
        {comments.length > 0 ? (
          <button type="button" className={`ox-chip${showComments ? ' is-active' : ''}`} aria-pressed={showComments} onClick={() => setShowComments((v) => !v)}>
            <Icon name="comment" size={14} /> Comments <span className="ox-chip-badge">{comments.length}</span>
          </button>
        ) : null}
        <button type="button" className="ox-chip" disabled={!canUndo} onClick={() => history('undo')}><Icon name="undo" size={14} /> Undo</button>
        <button type="button" className="ox-chip" disabled={!canRedo} onClick={() => history('redo')}><Icon name="redo" size={14} /> Redo</button>
      </div>

      {designId ? (
        <AssetPicker
          open={imagePicker}
          designId={designId}
          onClose={() => setImagePicker(false)}
          onPick={(src) => {
            setImagePicker(false);
            void commitProps({ src }, 'Image').then(() => flash({ kind: 'ok', msg: 'Image replaced' }));
          }}
        />
      ) : null}

      {showComments && comments.length > 0 ? (
        <div className="ox-comments-panel">
          <div className="ox-comments-head">
            <span>Comments <span className="ox-comments-count">{comments.length}</span></span>
            <button type="button" className="ox-icon-btn" aria-label="Close comments" onClick={() => setShowComments(false)}><Icon name="close" size={14} /></button>
          </div>
          <ul className="ox-comments-list">
            {comments.map((c, i) => (
              <li key={`${c.rel}:${c.line}:${i}`} className="ox-comment-row">
                <button type="button" className="ox-comment-item" onClick={() => focusComment(c)}>
                  <span className="ox-comment-text">{c.text}</span>
                  <span className="ox-comment-loc">{c.rel.split('/').slice(-1)[0]}:{c.line}</span>
                </button>
                <button type="button" className="ox-comment-del" title="Delete comment" onClick={() => deleteComment(c)}><Icon name="close" size={13} /></button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Geometry currently reflected in the element's inline style (post-gesture). */
function readGeomFromStyle(el: HTMLElement, base: Geom): Geom {
  const px = (v: string, fb: number) => (v ? Number.parseFloat(v) : fb);
  const rot = /rotate\(([-\d.]+)deg\)/.exec(el.style.transform || '');
  return {
    x: Math.round(px(el.style.left, base.x)),
    y: Math.round(px(el.style.top, base.y)),
    w: Math.round(px(el.style.width, base.w)),
    h: Math.round(px(el.style.height, base.h)),
    rotate: rot ? Math.round(Number(rot[1])) : base.rotate,
  };
}

function sameRect(a: DOMRect, b: DOMRect): boolean {
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}

const PANEL_W = 296; // matches .ox-pop width (styles.css, border-box)
const PANEL_MARGIN = 12;

function Popover({ rect, children }: { rect: DOMRect; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>(() => ({ top: rect.top, left: rect.right + 16 }));

  const place = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = el.offsetWidth || PANEL_W; // border-box width
    const h = el.offsetHeight || 0; // real content-driven height (<= 86vh)
    // Horizontal: prefer right of the object, flip left if it would overflow the
    // right edge, then clamp against both edges so it's never cut off.
    let left = rect.right + 16;
    if (left + w > vw - PANEL_MARGIN) left = rect.left - w - 16;
    left = Math.min(Math.max(PANEL_MARGIN, left), Math.max(PANEL_MARGIN, vw - w - PANEL_MARGIN));
    // Vertical: anchor near the object top, then clamp so the WHOLE panel stays
    // on-screen (the old fixed -460 could go negative / clip on short windows).
    let top = rect.top;
    top = Math.min(Math.max(PANEL_MARGIN, top), Math.max(PANEL_MARGIN, vh - h - PANEL_MARGIN));
    setPos((prev) => (prev.top === top && prev.left === left ? prev : { top, left }));
  }, [rect.top, rect.left, rect.right, rect.bottom]);

  // Position before paint; re-clamp as the content-driven height changes (the
  // comment textarea grows) and on window resize.
  useLayoutEffect(() => {
    place();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', place);
      return () => window.removeEventListener('resize', place);
    }
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener('resize', place);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [place]);

  return (
    <div ref={ref} className="ox-pop" style={{ top: pos.top, left: pos.left }}>
      {children}
    </div>
  );
}
