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
  // still null and we bail; re-run once the design is ready (content gets real
  // dimensions, same trigger the fit effect uses) so the listeners actually attach —
  // otherwise pinch-zoom and trackpad/drag pan silently never work.
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

    let panning = false;
    let last = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      // Pan on middle-drag or a plain left-drag of the canvas. In inspect mode the
      // inspector stops propagation for object/marquee gestures before this
      // stage-level handler runs, so a left-drag only pans the empty canvas (or
      // anywhere in view mode).
      const wantsPan = e.button === 0 || e.button === 1;
      if (!wantsPan) return;
      e.preventDefault();
      panning = true;
      last = { x: e.clientX, y: e.clientY };
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best-effort; panning still works without it */
      }
      stage.classList.add('ox-stage--grabbing');
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!panning) return;
      const p = panRef.current;
      setPan({ x: p.x + (e.clientX - last.x), y: p.y + (e.clientY - last.y) });
      last = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
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
  }, [stageRef, applyZoom, content.w, content.h]);

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
