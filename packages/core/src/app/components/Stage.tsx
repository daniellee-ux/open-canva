import { type RefObject } from 'react';
import type { DesignSystem } from '../../design';
import { type Artboard, resolveArtboard, type Scene } from '../../sdk';
import type { Viewport } from '../lib/viewport';
import { Board } from './Board';

export const BOARD_GAP = 96; // px between boards on the canvas, in artboard units

/** Lay scenes out in a horizontal row; return content bounds + per-board offsets. */
export function layoutBoards(scenes: Scene[], moduleArtboard?: Artboard) {
  let x = 0;
  let maxH = 0;
  const boards = scenes.map((scene, i) => {
    const artboard = resolveArtboard(scene, moduleArtboard);
    const at = { x, y: 0, artboard, scene, index: i };
    x += artboard.w + BOARD_GAP;
    maxH = Math.max(maxH, artboard.h);
    return at;
  });
  // Shorter boards sit vertically centered in the row; bake that into y so the
  // Stage render and zoom-to-board (viewport.fitTo) share one source of truth.
  for (const b of boards) b.y = (maxH - b.artboard.h) / 2;
  const w = boards.length ? x - BOARD_GAP : 0;
  return { boards, w, h: maxH };
}

/**
 * The zoomable, pannable canvas — replaces open-doc's scrolling `<main>`. Holds
 * every board; the `.ox-canvas` wrapper carries the single zoom/pan transform.
 */
export function Stage({
  stageRef,
  canvasRef,
  scenes,
  moduleArtboard,
  design,
  viewport,
}: {
  stageRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLDivElement>;
  scenes: Scene[];
  moduleArtboard?: Artboard;
  design: DesignSystem;
  viewport: Viewport;
}) {
  const { boards } = layoutBoards(scenes, moduleArtboard);
  const total = scenes.length;

  return (
    <div ref={stageRef} className="ox-stage">
      <div
        ref={canvasRef}
        className="ox-canvas"
        data-ox-zoom={viewport.zoom}
        style={{ transform: viewport.transform, transformOrigin: '0 0' }}
      >
        {boards.map((b) => (
          <div
            key={`${b.scene.id ?? 'scene'}-${b.index}`}
            className="ox-board-slot"
            style={{ position: 'absolute', left: b.x, top: b.y }}
          >
            {total > 1 ? (
              <div className="ox-board-caption">{b.scene.label ?? b.scene.id ?? `Board ${b.index + 1}`}</div>
            ) : null}
            <Board
              scene={b.scene}
              index={b.index}
              total={total}
              artboard={b.artboard}
              design={design}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
