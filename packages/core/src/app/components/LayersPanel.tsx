import { useEffect, useRef, useState } from 'react';
import type { Scene } from '../../sdk';

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
}

const TYPE_GLYPH: Record<string, string> = {
  box: '▭',
  text: 'T',
  ellipse: '◯',
  line: '╱',
  image: '▣',
  group: '⊞',
  icon: '★',
};

export function LayersPanel({
  scenes,
  title,
  designKey,
  onFocusBoard,
}: {
  scenes: Scene[];
  title: string;
  designKey: string;
  onFocusBoard: (index: number) => void;
}) {
  const [rows, setRows] = useState<ObjRow[]>([]);
  const tick = useRef(0);

  useEffect(() => {
    const canvas = document.querySelector<HTMLElement>('.ox-canvas');
    if (!canvas) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      const objs = Array.from(canvas.querySelectorAll<HTMLElement>('[data-ox-obj]'));
      setRows(
        objs.map((el) => ({
          el,
          type: el.getAttribute('data-ox-type') ?? 'object',
          label:
            (el.getAttribute('data-ox-type') === 'text' || el.getAttribute('data-ox-type') === 'icon'
              ? (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 22)
              : '') || el.getAttribute('data-ox-type') || 'object',
          x: Number(el.getAttribute('data-ox-x') ?? 0),
          y: Number(el.getAttribute('data-ox-y') ?? 0),
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

  return (
    <aside className="ox-layers">
      <div className="ox-layers-title">{title}</div>

      {scenes.length > 1 ? (
        <>
          <div className="ox-layers-section">Boards</div>
          <ul className="ox-layers-boards">
            {scenes.map((s, i) => (
              <li key={s.id ?? i}>
                <button type="button" onClick={() => onFocusBoard(i)}>
                  <span className="ox-board-dot" />
                  {s.label ?? s.id ?? `Board ${i + 1}`}
                </button>
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
            onMouseEnter={() => peek(r.el, true)}
            onMouseLeave={() => peek(r.el, false)}
          >
            <span className="ox-layer-glyph">{TYPE_GLYPH[r.type] ?? '●'}</span>
            <span className="ox-layer-label">{r.label}</span>
            <span className="ox-layer-pos">
              {r.x},{r.y}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
