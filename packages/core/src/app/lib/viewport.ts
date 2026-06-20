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

  // Fit once on mount (after layout), and whenever the content size changes.
  useEffect(() => {
    const id = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(id);
  }, [fit, content.w, content.h]);

  // Imperative wheel + pointer handlers, bound once (passive:false for zoom).
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
    let spaceHeld = false;
    let last = { x: 0, y: 0 };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceHeld = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceHeld = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      const wantsPan = e.button === 1 || (e.button === 0 && spaceHeld);
      if (!wantsPan) return;
      e.preventDefault();
      panning = true;
      last = { x: e.clientX, y: e.clientY };
      stage.setPointerCapture(e.pointerId);
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
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [stageRef, applyZoom]);

  return {
    zoom,
    pan,
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    zoomBy,
    zoomTo,
    fit,
    actualSize,
  };
}
