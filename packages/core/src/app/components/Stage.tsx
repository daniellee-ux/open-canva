import { type RefObject } from 'react';
import type { DesignSystem } from '../../design';
import { type Artboard, type BoardLayout, resolveArtboard, type Scene } from '../../sdk';
import type { Viewport } from '../lib/viewport';
import { Board } from './Board';

export const BOARD_GAP = 96; // px between boards on the canvas, in artboard units

interface PlacedBoard {
  x: number;
  y: number;
  artboard: Artboard;
  scene: Scene;
  index: number;
}

/** Offset of a board (or a line) inside the space it is aligned within. */
function offsetFor(align: 'start' | 'center' | 'end', slack: number) {
  return align === 'start' ? 0 : align === 'end' ? slack : slack / 2;
}

/**
 * Auto-arrange scenes on the canvas; return content bounds + per-board offsets.
 *
 * Boards flow along one axis (`layout.direction`, default `row`) and wrap onto a
 * new line every `layout.wrap` boards — or wherever a scene sets `break` — so a
 * design can be a row, a vertical stack, or a grid (e.g. six boards in a row and
 * a new version directly beneath them). Positions are baked in here so the Stage
 * render and zoom-to-board (`viewport.fitTo`) share one source of truth.
 */
export function layoutBoards(scenes: Scene[], moduleArtboard?: Artboard, layout?: BoardLayout) {
  const vertical = layout?.direction === 'column';
  const gap = layout?.gap ?? BOARD_GAP;
  const crossGap = layout?.crossGap ?? gap;
  // Guard against 0 / negative / fractional wrap counts — they'd make every
  // board its own line (or loop forever in the reader's head).
  const wrap = layout?.wrap && layout.wrap >= 1 ? Math.floor(layout.wrap) : Infinity;
  const align = layout?.align ?? 'center';
  const justify = layout?.justify ?? 'start';

  // Split into lines, keeping scene order (export + DOM order depend on it).
  const lines: PlacedBoard[][] = [];
  scenes.forEach((scene, i) => {
    const artboard = resolveArtboard(scene, moduleArtboard);
    const line = lines[lines.length - 1];
    if (!line || scene.break || line.length >= wrap) lines.push([{ x: 0, y: 0, artboard, scene, index: i }]);
    else line.push({ x: 0, y: 0, artboard, scene, index: i });
  });

  // Main axis = the flow axis (x in a row, y in a column); cross = the other one.
  const mainSize = (a: Artboard) => (vertical ? a.h : a.w);
  const crossSize = (a: Artboard) => (vertical ? a.w : a.h);

  const lineMains = lines.map((line) => line.reduce((sum, b) => sum + mainSize(b.artboard), 0) + gap * (line.length - 1));
  const totalMain = lineMains.length ? Math.max(...lineMains) : 0;

  let cross = 0;
  lines.forEach((line, li) => {
    const lineCross = Math.max(...line.map((b) => crossSize(b.artboard)));
    let main = offsetFor(justify, totalMain - lineMains[li]);
    for (const b of line) {
      const off = cross + offsetFor(align, lineCross - crossSize(b.artboard));
      b.x = vertical ? off : main;
      b.y = vertical ? main : off;
      main += mainSize(b.artboard) + gap;
    }
    cross += lineCross + crossGap;
  });
  const totalCross = lines.length ? cross - crossGap : 0;

  return {
    boards: lines.flat(),
    w: vertical ? totalCross : totalMain,
    h: vertical ? totalMain : totalCross,
  };
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
  layout,
  design,
  viewport,
}: {
  stageRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLDivElement>;
  scenes: Scene[];
  moduleArtboard?: Artboard;
  layout?: BoardLayout;
  design: DesignSystem;
  viewport: Viewport;
}) {
  const { boards } = layoutBoards(scenes, moduleArtboard, layout);
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
