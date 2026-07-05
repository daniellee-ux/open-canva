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
  /** Index of the canvas board this object lives on, for per-board grouping. */
  board: number;
  /** Stable per-element React key, so reordering rows doesn't strand a hover class. */
  key: number;
}

const TYPE_ICON: Record<string, IconName> = {
  box: 'box',
  text: 'text',
  ellipse: 'ellipse',
  line: 'line',
  image: 'image',
  group: 'group',
  icon: 'spark',
  // Reuses the closest existing glyph rather than adding a bespoke one — a
  // deliberate, acknowledged compromise, not a precise fit.
  illustration: 'image',
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
  // Per-board expand/collapse overrides for the grouped layer tree. Without an
  // override a group is open iff its board is active, so switching boards
  // "filters" the tree to the focused board while still allowing a manual peek.
  const [openOverrides, setOpenOverrides] = useState<Record<number, boolean>>({});
  const tick = useRef(0);
  const activeBoardRef = useRef<HTMLLIElement>(null);
  const selectedRowRef = useRef<HTMLLIElement>(null);
  const dragIdx = useRef<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  // Stable identity per object element so row keys survive list reorder/mutation
  // (an array-index key strands the ox-peek hover class on the wrong element).
  const idMap = useRef(new WeakMap<HTMLElement, number>());
  const nextId = useRef(0);
  const keyFor = (el: HTMLElement) => {
    let id = idMap.current.get(el);
    if (id == null) {
      id = nextId.current++;
      idMap.current.set(el, id);
    }
    return id;
  };

  const onBoardOp = (p: Promise<unknown>, ok: string) => {
    p.then(() => toast.ok(ok)).catch((e) => toast.err(String((e as Error)?.message ?? e)));
  };

  // Keep the active board in view as the user steps through boards.
  useEffect(() => {
    activeBoardRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeBoard]);

  // Reset expand/collapse overrides when the focus context changes, so the tree
  // always re-opens on (only) the newly active board's group. Overrides are
  // keyed by board index, so a structural change (delete/duplicate/reorder —
  // anything that alters the id sequence) must also reset them or they'd stick
  // to the wrong boards; plain content edits keep the sequence and the state.
  const boardsSig = scenes.map((s) => s.id ?? '').join('|');
  useEffect(() => {
    setOpenOverrides({});
  }, [activeBoard, designKey, boardsSig]);

  // A canvas selection can land in a collapsed group (an object on a non-active
  // board, or on the active board after a manual collapse) — force that group
  // open so the selected row exists to highlight and scroll to. Latched per
  // element: the effect's rows/activeBoard deps churn (MutationObserver refresh,
  // board switches with a stale selection), and re-forcing on churn would both
  // defeat a manual collapse and resurrect overrides the reset above just wiped.
  const lastForced = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!selectedEl) {
      lastForced.current = null;
      return;
    }
    if (lastForced.current === selectedEl) return;
    const board = rows.find((r) => r.el === selectedEl)?.board;
    if (board == null) return; // rows may lag the DOM; retry on the next refresh
    lastForced.current = selectedEl;
    setOpenOverrides((o) => ((o[board] ?? board === activeBoard) ? o : { ...o, [board]: true }));
  }, [selectedEl, rows, activeBoard]);

  // Bring the selected object's row into view (canvas selection → panel), once
  // per selection. openOverrides is a dep so a selection landing on a collapsed
  // group retries after the forced expand mounts the row — but a manual
  // expand/collapse elsewhere must not yank the scroll back here.
  const lastScrolled = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!selectedEl) {
      lastScrolled.current = null;
      return;
    }
    if (selectedRowRef.current && lastScrolled.current !== selectedEl) {
      selectedRowRef.current.scrollIntoView({ block: 'nearest' });
      lastScrolled.current = selectedEl;
    }
  }, [selectedEl, openOverrides]);

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
      // Canvas boards render in scenes order, so DOM index == scene index.
      const boardEls = Array.from(canvas.querySelectorAll<HTMLElement>('[data-ox-board]'));
      const boardOf = (el: HTMLElement) => {
        const board = el.closest<HTMLElement>('[data-ox-board]');
        return board ? Math.max(0, boardEls.indexOf(board)) : 0;
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
          board: boardOf(el),
          key: keyFor(el),
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
    const fire = () => {
      const r = el.getBoundingClientRect();
      const cx = Math.round(r.left + r.width / 2);
      const cy = Math.round(r.top + r.height / 2);
      el.dispatchEvent(new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: cx, clientY: cy, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: cx, clientY: cy, bubbles: true }));
    };
    // If the object lives on a non-active board, focus that board first so the
    // toolbar and selection agree. The inspector drops its selection when the
    // active board changes, so defer the select a frame to land after that.
    const board = el.closest<HTMLElement>('[data-ox-board]');
    if (board) {
      const boards = Array.from(document.querySelectorAll<HTMLElement>('.ox-canvas [data-ox-board]'));
      const idx = boards.indexOf(board);
      if (idx >= 0 && idx !== activeBoard) {
        onFocusBoard(idx);
        requestAnimationFrame(fire);
        return;
      }
    }
    fire();
  };

  const boardsRail =
    scenes.length > 1 ? (
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
    ) : null;

  const renderRow = (r: ObjRow) => (
    <li
      key={r.key}
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
  );

  const isOpen = (i: number) => openOverrides[i] ?? i === activeBoard;

  return (
    <aside className="ox-layers">
      {boardsRail}

      <div className="ox-layers-section">
        Layers <span className="ox-layers-count">{rows.length}</span>
      </div>
      {scenes.length > 1 ? (
        scenes.map((s, i) => {
          const group = rows.filter((r) => r.board === i);
          const open = isOpen(i);
          return (
            <section key={`${s.id ?? 'scene'}-${i}`} className={`ox-layers-group${i === activeBoard ? ' is-active' : ''}`}>
              <button
                type="button"
                className={`ox-layers-group-head${open ? ' is-open' : ''}`}
                aria-expanded={open}
                onClick={() => setOpenOverrides((o) => ({ ...o, [i]: !open }))}
              >
                <span className="ox-layers-group-caret"><Icon name="caret" size={12} /></span>
                <span className="ox-layers-group-label">{s.label ?? s.id ?? `Board ${i + 1}`}</span>
                <span className="ox-layers-count">{group.length}</span>
              </button>
              {open ? (
                <ul className="ox-layers-objs">
                  {group.length === 0 ? <li className="ox-layers-empty">Empty board</li> : group.map(renderRow)}
                </ul>
              ) : null}
            </section>
          );
        })
      ) : (
        <ul className="ox-layers-objs">
          {rows.length === 0 ? <li className="ox-layers-empty">No objects yet</li> : rows.map(renderRow)}
        </ul>
      )}
    </aside>
  );
}
