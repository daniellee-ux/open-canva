import type { CSSProperties } from 'react';
import { type DesignSystem, defaultDesign, designToCssVars } from '../../design';
import type { Artboard, Scene } from '../../sdk';
import { SceneProvider } from '../../scene-context';

/**
 * One artboard — replaces open-doc's `DocSurface`. Carries the `[data-ox-board]`
 * theming root (analog of open-slide's `[data-osd-canvas]`) so every
 * `var(--ox-*)` resolves here. It's a fixed-size, `position: relative` frame; the
 * scene's objects position absolutely within it. Clips to the artboard bounds.
 *
 * NOTE: the zoom transform is applied by the parent `Stage`, never here — so the
 * inspector's rect math stays correct (the canva click-to-source invariant).
 */
export function Board({
  scene: S,
  index,
  total,
  artboard,
  design = defaultDesign,
  style,
}: {
  scene: Scene;
  index: number;
  total: number;
  artboard: Artboard;
  design?: DesignSystem;
  style?: CSSProperties;
}) {
  return (
    <div
      data-ox-board
      data-ox-scene={S.id ?? `scene-${index + 1}`}
      className="ox-board"
      style={{
        ...designToCssVars(design),
        width: artboard.w,
        height: artboard.h,
        background: artboard.background ?? 'var(--ox-bg)',
        ...style,
      }}
    >
      <SceneProvider index={index} total={total}>
        <S />
      </SceneProvider>
    </div>
  );
}
