import { useLayoutEffect, useRef, useState } from 'react';
import type { DesignSystem } from '../../design';
import type { Artboard, Scene } from '../../sdk';
import { Board } from './Board';

/**
 * A live, static preview of one scene: renders the real `Board` and scales it to
 * fit (contain) inside a measured frame. Shared by the workspace design cards and
 * the LayersPanel board rail. The frame element carries `className` and is what
 * gets measured, so callers control its size/aspect via CSS.
 */
export function ThumbBoard({
  scene,
  artboard,
  design,
  className,
}: {
  scene: Scene;
  artboard: Artboard;
  design?: DesignSystem;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ s: number; x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const fw = el.clientWidth;
      const fh = el.clientHeight;
      if (!fw || !fh) return;
      const s = Math.min(fw / artboard.w, fh / artboard.h);
      setFit({ s, x: (fw - artboard.w * s) / 2, y: (fh - artboard.h * s) / 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [artboard.w, artboard.h]);

  return (
    <div ref={frameRef} className={className}>
      <div
        className="ox-thumb-inner"
        style={{
          width: artboard.w,
          height: artboard.h,
          transform: fit ? `translate(${fit.x}px, ${fit.y}px) scale(${fit.s})` : 'scale(0)',
          transformOrigin: '0 0',
          opacity: fit ? 1 : 0,
        }}
      >
        <Board scene={scene} index={0} total={1} artboard={artboard} design={design} />
      </div>
    </div>
  );
}
