import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

/**
 * The canvas navigation model — replaces open-doc's scroll + TOC. Owns zoom and
 * pan for the infinite design canvas:
 *   - trackpad pinch / ⌘+wheel  → zoom about the cursor
 *   - wheel / two-finger scroll → pan
 *   - space-drag or middle-drag → pan
 *
 * INVARIANT (the canva adaptation of the click-to-source rule): the zoom/pan
 * transform lives on the canvas WRAPPER, never on an inspected object — so the
 * inspector's `getBoundingClientRect` stays correct under zoom; only drag-delta →
 * artboard-delta needs `÷ zoom`.
 */
export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
  transform: string;
  zoomBy: (factor: number) => void;
  zoomTo: (z: number) => void;
  /** Pan by a screen-pixel delta (used by the inspector's edit-mode pan gesture). */
  panBy: (dx: number, dy: number) => void;
  fit: () => void;
  actualSize: () => void;
}

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;
const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export function useViewport(
  stageRef: RefObject<HTMLElement>,
  content: { w: number; h: number },
): Viewport {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Keep latest values in refs so the imperative wheel/pointer handlers (bound
  // once) always read fresh state without re-subscribing.
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;
  const contentRef = useRef(content);
  contentRef.current = content;

  const applyZoom = useCallback((nextZoom: number, originX: number, originY: number) => {
    const z0 = zoomRef.current;
    const z1 = clamp(nextZoom);
    if (z1 === z0) return;
    const p0 = panRef.current;
    // Keep the point under the cursor stationary.
    setPan({
      x: originX - (originX - p0.x) * (z1 / z0),
      y: originY - (originY - p0.y) * (z1 / z0),
    });
    setZoom(z1);
  }, []);

  const fit = useCallback(() => {
    const stage = stageRef.current;
    const { w, h } = contentRef.current;
    if (!stage || !w || !h) return;
    const rect = stage.getBoundingClientRect();
    const pad = 0.86;
    const z = clamp(Math.min(rect.width / w, rect.height / h) * pad);
    setZoom(z);
    setPan({ x: (rect.width - w * z) / 2, y: (rect.height - h * z) / 2 });
  }, [stageRef]);

  const actualSize = useCallback(() => {
    const stage = stageRef.current;
    const { w, h } = contentRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    setZoom(1);
    setPan({ x: (rect.width - w) / 2, y: (rect.height - h) / 2 });
  }, [stageRef]);

  const zoomBy = useCallback(
    (factor: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      applyZoom(zoomRef.current * factor, rect.width / 2, rect.height / 2);
    },
    [stageRef, applyZoom],
  );

  const zoomTo = useCallback(
    (z: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      applyZoom(z, rect.width / 2, rect.height / 2);
    },
    [stageRef, applyZoom],
  );

  const panBy = useCallback((dx: number, dy: number) => {
    const p = panRef.current;
    setPan({ x: p.x + dx, y: p.y + dy });
  }, []);

  // Fit once on mount (after layout), and whenever the content size changes.
  useEffect(() => {
    const id = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(id);
  }, [fit, content.w, content.h]);

  // Imperative wheel + pointer handlers (passive:false for zoom). The host renders
  // a "Loading…" placeholder before <Stage> mounts, so on the first run stageRef is
  // still null and we bail; re-run once the design is READY (a boolean that flips
  // false→true when content first gets real dimensions) so the listeners attach.
  // We depend on the boolean, NOT the raw dimensions, so a later size change (board
  // add/delete) can't tear down and re-attach listeners mid-pan-gesture — which
  // would freeze the pan and strand the grabbing cursor.
  const ready = content.w > 0 && content.h > 0;
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Pinch-zoom (trackpad sends ctrlKey) or ⌘+wheel.
        e.preventDefault();
        const rect = stage.getBoundingClientRect();
        const factor = Math.exp(-e.deltaY * 0.01);
        applyZoom(zoomRef.current * factor, e.clientX - rect.left, e.clientY - rect.top);
      } else {
        // Pan.
        e.preventDefault();
        const p = panRef.current;
        setPan({ x: p.x - e.deltaX, y: p.y - e.deltaY });
      }
    };

    const PAN_THRESHOLD = 3; // px the pointer must travel before a press becomes a pan
    let panning = false;
    let pending = false; // a left/middle press is down but hasn't moved far enough yet
    let start = { x: 0, y: 0 };
    let last = { x: 0, y: 0 };
    let pointerId = -1;

    const beginPan = (e: PointerEvent) => {
      panning = true;
      pending = false;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best-effort; panning still works without it */
      }
      stage.classList.add('ox-stage--grabbing');
      // Drop any text selection a sub-threshold drag may have started.
      window.getSelection?.()?.removeAllRanges();
    };

    const onPointerDown = (e: PointerEvent) => {
      // Pan on middle-drag or a plain left-drag of the canvas. In inspect mode the
      // inspector stops propagation for object/marquee gestures before this
      // stage-level handler runs, so a left-drag only pans the empty canvas (or
      // anywhere in view mode). Crucially we DON'T preventDefault or grab here — a
      // plain click must still select text / focus; we only commit to a pan once the
      // pointer actually moves past the threshold (see onPointerMove).
      if (e.button !== 0 && e.button !== 1) return;
      pending = true;
      pointerId = e.pointerId;
      start = { x: e.clientX, y: e.clientY };
      last = start;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pending && !panning && e.pointerId === pointerId) {
        if (Math.abs(e.clientX - start.x) < PAN_THRESHOLD && Math.abs(e.clientY - start.y) < PAN_THRESHOLD) return;
        beginPan(e);
      }
      if (!panning) return;
      e.preventDefault();
      const p = panRef.current;
      setPan({ x: p.x + (e.clientX - last.x), y: p.y + (e.clientY - last.y) });
      last = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      pending = false;
      if (!panning) return;
      panning = false;
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      stage.classList.remove('ox-stage--grabbing');
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [stageRef, applyZoom, ready]);

  return {
    zoom,
    pan,
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    zoomBy,
    zoomTo,
    panBy,
    fit,
    actualSize,
  };
}
