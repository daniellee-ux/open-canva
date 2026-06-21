import { useEffect, useRef, useState } from 'react';
import type { DesignSystem } from '../../design';
import { type Artboard, resolveArtboard, type Scene } from '../../sdk';
import { deleteBoard, duplicateBoard, reorderBoards } from '../lib/design-crud';
import { ThumbBoard } from './ThumbBoard';
import { Menu } from './ui/Menu';
import { toast } from './ui/toast';
import { Icon, type IconName } from './icons';

const isDev = import.meta.env.DEV;

/**
 * Layers + boards navigator — replaces open-doc's table of contents. Lists the
 * design's boards (click to focus) and the live object inventory of the canvas
 * (queried from the DOM, refreshed via a MutationObserver so it tracks edits).
 * Hovering a layer row peeks the object on the canvas.
 */
interface ObjRow {
  el: HTMLElement;
  type: string;
  label: string;
  x: number;
  y: number;
  /** Nesting depth (objects inside a Group/Box), for the indented layer tree. */
  depth: number;
}

const TYPE_ICON: Record<string, IconName> = {
  box: 'box',
  text: 'text',
  ellipse: 'ellipse',
  line: 'line',
  image: 'image',
  group: 'group',
  icon: 'spark',
};

export function LayersPanel({
  scenes,
  designKey,
  activeBoard,
  onFocusBoard,
  design,
  moduleArtboard,
  selectedEl,
}: {
  scenes: Scene[];
  designKey: string;
  activeBoard: number;
  onFocusBoard: (index: number) => void;
  design: DesignSystem;
  moduleArtboard?: Artboard;
  /** The currently-selected canvas object, to highlight + scroll its row into view. */
  selectedEl?: HTMLElement | null;
}) {
  const [rows, setRows] = useState<ObjRow[]>([]);
  const tick = useRef(0);
  const activeBoardRef = useRef<HTMLLIElement>(null);
  const selectedRowRef = useRef<HTMLLIElement>(null);
  const dragIdx = useRef<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const onBoardOp = (p: Promise<unknown>, ok: string) => {
    p.then(() => toast.ok(ok)).catch((e) => toast.err(String((e as Error)?.message ?? e)));
  };

  // Keep the active board in view as the user steps through boards.
  useEffect(() => {
    activeBoardRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeBoard]);

  // Bring the selected object's row into view (canvas selection → panel).
  useEffect(() => {
    if (selectedEl) selectedRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedEl]);

  useEffect(() => {
    const canvas = document.querySelector<HTMLElement>('.ox-canvas');
    if (!canvas) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      // querySelectorAll yields document order (a container immediately before its
      // children), so a depth count turns the flat list into a readable tree.
      const depthOf = (el: HTMLElement) => {
        let d = 0;
        for (let p = el.parentElement; p && p !== canvas; p = p.parentElement) {
          if (p.hasAttribute('data-ox-obj')) d++;
        }
        return d;
      };
      const objs = Array.from(canvas.querySelectorAll<HTMLElement>('[data-ox-obj]'));
      setRows(
        objs.map((el) => ({
          el,
          type: el.getAttribute('data-ox-type') ?? 'object',
          label:
            el.getAttribute('data-ox-name') ||
            (el.getAttribute('data-ox-type') === 'text' || el.getAttribute('data-ox-type') === 'icon'
              ? (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 22)
              : '') || el.getAttribute('data-ox-type') || 'object',
          x: Number(el.getAttribute('data-ox-x') ?? 0),
          y: Number(el.getAttribute('data-ox-y') ?? 0),
          depth: depthOf(el),
        })),
      );
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 80);
    };
    refresh();
    const mo = new MutationObserver(schedule);
    mo.observe(canvas, { childList: true, subtree: true, attributes: true });
    return () => {
      mo.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [designKey, tick]);

  const peek = (el: HTMLElement, on: boolean) => el.classList.toggle('ox-peek', on);

  // Click a layer row to select that object on the canvas — especially useful for
  // a <Group>, whose children cover it so it's hard to click directly. Dispatching
  // pointerdown on the element itself routes through the inspector's own select
  // path (closest(OBJ) resolves to this element, not whatever is under the cursor).
  // Only meaningful in edit mode, where the inspector is listening.
  const selectObj = (el: HTMLElement) => {
    if (!document.querySelector('.ox-app')?.classList.contains('is-inspecting')) return;
    const r = el.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2);
    const cy = Math.round(r.top + r.height / 2);
    el.dispatchEvent(new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: cx, clientY: cy, bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: cx, clientY: cy, bubbles: true }));
  };

  return (
    <aside className="ox-layers">
      {scenes.length > 1 ? (
        <>
          <div className="ox-layers-section">Boards</div>
          <ul className="ox-layers-boards">
            {scenes.map((s, i) => (
              <li
                // Index-suffixed so a duplicated board (which shares the source
                // component's id) can't collide with its twin.
                key={`${s.id ?? 'scene'}-${i}`}
                ref={i === activeBoard ? activeBoardRef : undefined}
                className={`${i === activeBoard ? 'is-active' : ''}${dropIdx === i ? ' is-drop' : ''}`}
                draggable={isDev}
                onDragStart={(e) => {
                  dragIdx.current = i;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (dragIdx.current == null) return;
                  e.preventDefault();
                  setDropIdx(i);
                }}
                onDragLeave={() => setDropIdx((d) => (d === i ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragIdx.current;
                  dragIdx.current = null;
                  setDropIdx(null);
                  if (from == null || from === i) return;
                  const order = scenes.map((_, k) => k);
                  const [m] = order.splice(from, 1);
                  order.splice(i, 0, m);
                  onBoardOp(reorderBoards(designKey, order), 'Boards reordered');
                }}
                onDragEnd={() => {
                  dragIdx.current = null;
                  setDropIdx(null);
                }}
              >
                <button type="button" aria-current={i === activeBoard ? 'true' : undefined} onClick={() => onFocusBoard(i)}>
                  <ThumbBoard
                    scene={s}
                    artboard={resolveArtboard(s, moduleArtboard)}
                    design={design}
                    className="ox-board-thumb"
                  />
                  <span className="ox-board-name">
                    <span className="ox-board-index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="ox-board-label">{s.label ?? s.id ?? `Board ${i + 1}`}</span>
                  </span>
                </button>
                {isDev ? (
                  <div className="ox-board-menu">
                    <Menu
                      label={`Board ${i + 1} actions`}
                      button={<span className="ox-board-menu-btn"><Icon name="caret" size={14} /></span>}
                      items={[
                        { label: 'Duplicate', icon: 'group', onSelect: () => onBoardOp(duplicateBoard(designKey, i), 'Board duplicated') },
                        {
                          label: 'Delete',
                          icon: 'close',
                          danger: true,
                          disabled: scenes.length <= 1,
                          onSelect: () => onBoardOp(deleteBoard(designKey, i), 'Board deleted'),
                        },
                      ]}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="ox-layers-section">
        Layers <span className="ox-layers-count">{rows.length}</span>
      </div>
      <ul className="ox-layers-objs">
        {rows.length === 0 ? <li className="ox-layers-empty">No objects yet</li> : null}
        {rows.map((r, i) => (
          <li
            key={i}
            ref={r.el === selectedEl ? selectedRowRef : undefined}
            className={`${r.type === 'group' ? 'is-group' : r.depth > 0 ? 'is-child' : ''}${r.el === selectedEl ? ' is-selected' : ''}`.trim() || undefined}
            style={{ paddingLeft: 10 + r.depth * 16 }}
            onMouseEnter={() => peek(r.el, true)}
            onMouseLeave={() => peek(r.el, false)}
            onClick={() => selectObj(r.el)}
          >
            <span className="ox-layer-chip">
              <span className="ox-layer-glyph"><Icon name={TYPE_ICON[r.type] ?? 'dot'} size={14} /></span>
              <span className="ox-layer-label">{r.label}</span>
              <span className="ox-layer-pos">{r.x},{r.y}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
