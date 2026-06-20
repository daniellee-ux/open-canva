import { useCallback, useEffect, useRef, useState } from 'react';
import { type CanvaSource, findCanvaSource } from '../lib/fiber';
import { Icon } from './icons';

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
type Gesture =
  | { mode: 'move'; base: Geom; px: number; py: number; moved: boolean }
  | { mode: 'resize'; handle: Handle; base: Geom; px: number; py: number; moved: boolean }
  | { mode: 'rotate'; base: Geom; cx: number; cy: number; startAngle: number; moved: boolean };

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

export function Inspector({
  active,
  zoom,
  revision = 0,
  designId,
  onSelectionChange,
}: {
  active: boolean;
  zoom: number;
  /** Bumped by the host on every HMR re-render so the inspector can re-bind its
   *  selection to the new DOM node (the old one is detached — trap-adjacent). */
  revision?: number;
  /** Current design id, used to list its pending comment markers for the badges. */
  designId?: string;
  onSelectionChange?: (src: CanvaSource | null) => void;
}) {
  const [sel, setSel] = useState<Sel | null>(null);
  const [selRect, setSelRect] = useState<DOMRect | null>(null);
  const [selBox, setSelBox] = useState<SelBox | null>(null);
  const [hovRect, setHovRect] = useState<DOMRect | null>(null);
  const [hovBox, setHovBox] = useState<SelBox | null>(null);
  const [commentRects, setCommentRects] = useState<{ text: string; rect: DOMRect }[]>([]);
  const [commentNonce, setCommentNonce] = useState(0);
  const commentEls = useRef<{ text: string; el: HTMLElement }[]>([]);
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const selRef = useRef<Sel | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const raf = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
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
      const objs = [...document.querySelectorAll<HTMLElement>(OBJ)]
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
      return;
    }
    let alive = true;
    fetch(`/__ox/comments?design=${encodeURIComponent(designId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) resolveComments(d.comments ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [active, designId, revision, commentNonce, resolveComments]);

  const select = useCallback(
    (el: HTMLElement) => {
      const src = findCanvaSource(el);
      const next: Sel = { el, src, type: el.getAttribute('data-ox-type') ?? 'object' };
      selRef.current = next;
      setSel(next);
      const { rect, box } = boxOf(el, zoomRef.current || 1);
      setSelRect(rect);
      setSelBox(box);
      setHovRect(null);
      setHovBox(null);
      setText((el.textContent ?? '').replace(/\s+/g, ' ').trim());
      setComment('');
      onSelectionChange?.(src);
    },
    [onSelectionChange],
  );

  const deselect = useCallback(() => {
    selRef.current = null;
    setSel(null);
    setSelRect(null);
    setSelBox(null);
    onSelectionChange?.(null);
  }, [onSelectionChange]);

  const commitProps = useCallback(
    async (props: Record<string, number | string>, label: string) => {
      const s = selRef.current;
      if (!s?.src) return;
      try {
        await post('/__ox/edit', {
          rel: s.src.rel, line: s.src.line, column: s.src.column, op: 'prop', payload: { props },
        });
      } catch (err) {
        flash({ kind: 'err', msg: `${label}: ${String((err as Error).message ?? err)}` });
      }
    },
    [flash],
  );

  /* ----- one unified gesture engine ---------------------------------------- */

  const onGesturePointerMove = useCallback(
    (e: PointerEvent) => {
      const g = gesture.current;
      const s = selRef.current;
      if (!g || !s) return;
      const z = zoomRef.current || 1;

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
        let nx = g.base.x + dx;
        let ny = g.base.y + dy;
        if (e.shiftKey) (Math.abs(dx) > Math.abs(dy) ? (ny = g.base.y) : (nx = g.base.x));
        s.el.style.left = `${Math.round(nx)}px`;
        s.el.style.top = `${Math.round(ny)}px`;
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
    const s = selRef.current;
    gesture.current = null;
    window.removeEventListener('pointermove', onGesturePointerMove);
    window.removeEventListener('pointerup', onGesturePointerUp);
    window.removeEventListener('pointercancel', onGesturePointerUp);
    if (!g || !s || !g.moved) return;
    const live = readGeomFromStyle(s.el, g.base);
    if (g.mode === 'move') {
      await commitProps({ x: live.x, y: live.y }, 'Move');
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
  }, [commitProps, onGesturePointerMove]);

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
      if (e.button !== 0 || e.altKey) return; // alt/space/middle reserved for panning
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(OBJ);
      if (!el || !canvas.contains(el)) return deselect();
      e.preventDefault();
      e.stopPropagation();
      if (!selRef.current || selRef.current.el !== el) select(el);
      beginGesture({ mode: 'move', base: readGeom(el), px: e.clientX, py: e.clientY, moved: false });
    };
    const onKey = (e: KeyboardEvent) => {
      const s = selRef.current;
      if (!s) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') return deselect();
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return void removeSelectedRef.current?.(); }
      const step = e.shiftKey ? 10 : 1;
      const b = readGeom(s.el);
      if (e.key === 'ArrowLeft') void commitProps({ x: b.x - step }, 'Nudge');
      else if (e.key === 'ArrowRight') void commitProps({ x: b.x + step }, 'Nudge');
      else if (e.key === 'ArrowUp') void commitProps({ y: b.y - step }, 'Nudge');
      else if (e.key === 'ArrowDown') void commitProps({ y: b.y + step }, 'Nudge');
      else return;
      e.preventDefault();
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', reflow, true);
    window.addEventListener('resize', reflow);
    window.addEventListener('keydown', onKey);
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', reflow, true);
      window.removeEventListener('resize', reflow);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', onGesturePointerMove);
      window.removeEventListener('pointerup', onGesturePointerUp);
      window.removeEventListener('pointercancel', onGesturePointerUp);
      cancelAnimationFrame(raf.current);
    };
  }, [active, deselect, select, reflow, beginGesture, commitProps, onGesturePointerMove, onGesturePointerUp]);

  // Reframe when the canvas transform changes.
  useEffect(reflow, [zoom, reflow]);

  // After an HMR re-render (revision bumps), the previously selected DOM node has
  // been replaced. Re-bind the selection to the new node at the same source
  // location so the frame keeps tracking the object across edits.
  useEffect(() => {
    const s = selRef.current;
    if (!s) return;
    if (s.el.isConnected) {
      reflow();
      return;
    }
    if (s.src) {
      const objs = document.querySelectorAll<HTMLElement>(OBJ);
      for (const el of objs) {
        const src = findCanvaSource(el);
        if (src && src.rel === s.src.rel && src.line === s.src.line && src.column === s.src.column) {
          const next: Sel = { ...s, el };
          selRef.current = next;
          setSel(next);
          const { rect, box } = boxOf(el, zoomRef.current || 1);
          setSelRect(rect);
          setSelBox(box);
          return;
        }
      }
    }
    deselect();
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
  const bumpSize = useCallback(
    (delta: number) => {
      const s = selRef.current;
      if (!s) return;
      const px = Number.parseFloat(getComputedStyle(s.el).fontSize) || 48;
      void commitProps({ size: Math.max(6, Math.round(px + delta)) }, 'Size');
    },
    [commitProps],
  );
  const toggleBold = useCallback(() => {
    const s = selRef.current;
    if (!s) return;
    const w = Number.parseInt(getComputedStyle(s.el).fontWeight, 10) || 400;
    void commitProps({ weight: w >= 600 ? 400 : 700 }, 'Weight');
  }, [commitProps]);
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
    try {
      await post('/__ox/edit', { rel: s.src.rel, line: s.src.line, column: s.src.column, op: 'remove' });
      flash({ kind: 'ok', msg: `Deleted <${s.src.tag}>` });
      deselect();
    } catch (err) {
      flash({ kind: 'err', msg: String((err as Error).message ?? err) });
    }
  }, [flash, deselect]);
  const removeSelectedRef = useRef(removeSelected);
  removeSelectedRef.current = removeSelected;

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
        flash(data.empty ? { kind: 'err', msg: `Nothing to ${dir}` } : { kind: 'ok', msg: `${dir === 'undo' ? 'Undid' : 'Redid'} → ${data.file}` });
      } catch (err) {
        flash({ kind: 'err', msg: String((err as Error).message ?? err) });
      }
    },
    [flash],
  );

  if (!active) return null;

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

      {sel && selRect && frameStyle ? (
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
                <textarea className="ox-pop-text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveText(); }} />
                <div className="ox-pop-actions">
                  <button type="button" className="ox-chip" title="Bold" onClick={toggleBold}><b>B</b></button>
                  <button type="button" className="ox-chip" title="Smaller" onClick={() => bumpSize(-4)}>A−</button>
                  <button type="button" className="ox-chip" title="Bigger" onClick={() => bumpSize(6)}>A+</button>
                  <button type="button" className="ox-pop-btn ox-pop-btn--primary" disabled={!sel.src} onClick={saveText}>Save text</button>
                </div>
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
              <button type="button" className="ox-chip ox-chip--danger" onClick={removeSelected}>Delete</button>
            </div>

            <label className="ox-pop-label">Comment for the agent</label>
            <textarea className="ox-pop-text" value={comment} placeholder="e.g. “make this headline pop more”" onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runComment(); }} />
            <div className="ox-pop-actions">
              <button type="button" className="ox-pop-btn" onClick={deselect}>Close</button>
              <button type="button" className="ox-pop-btn" disabled={!sel.src || !comment.trim()} onClick={runComment}>Add comment</button>
            </div>
          </Popover>
        </>
      ) : null}

      <div className="ox-inspect-bar">
        <span className="ox-inspect-hint">Click an object · drag to move · ⌫ delete</span>
        <button type="button" className="ox-chip" onClick={() => history('undo')}><Icon name="undo" size={14} /> Undo</button>
        <button type="button" className="ox-chip" onClick={() => history('redo')}><Icon name="redo" size={14} /> Redo</button>
      </div>

      {toast ? (
        <div className={`ox-toast ox-toast--${toast.kind}`} role={toast.kind === 'err' ? 'alert' : 'status'}>
          <span className="ox-toast-glyph" aria-hidden><Icon name={toast.kind === 'err' ? 'warn' : 'check'} size={14} /></span>
          {toast.msg}
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

function Popover({ rect, children }: { rect: DOMRect; children: React.ReactNode }) {
  const top = Math.min(Math.max(rect.top, 12), window.innerHeight - 460);
  const right = rect.right + 16;
  const left = right + 300 > window.innerWidth ? Math.max(12, rect.left - 312) : right;
  return (
    <div className="ox-pop" style={{ top, left }}>
      {children}
    </div>
  );
}
