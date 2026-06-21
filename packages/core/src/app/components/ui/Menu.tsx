import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '../icons';

/**
 * Click-to-open dropdown menu (also serves as a context/action menu and, via
 * `SelectMenu` below, as the single styled replacement for native <select>s).
 * Closes on outside-click, Esc, or scroll. One dropdown surface across the whole
 * app keeps every menu consistent.
 *
 * The list is rendered in a portal as a fixed-positioned popover so it can never
 * be clipped by an ancestor's `overflow` (card thumbnails, scrolling panels, …).
 * Theme tokens live on :root, so the portaled list still inherits them.
 */
export type MenuItem =
  | { separator: true }
  | {
      label: string;
      icon?: IconName;
      onSelect: () => void;
      danger?: boolean;
      disabled?: boolean;
      /** Show a trailing check (for single-choice/select menus). */
      checked?: boolean;
    };

type Pos = { top?: number; bottom?: number; left?: number; right?: number; maxHeight: number };

export function Menu({
  button,
  items,
  align = 'end',
  label,
  triggerClassName,
}: {
  button: ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
  label?: string;
  /** Replaces the default bare trigger styling (e.g. a button or select look). */
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Position the popover under the trigger (anchored to the side `align` picks),
  // flipping above and/or capping its height when it would overrun the viewport.
  // The list is measured first (rendered off-screen until `pos` is set).
  const place = useCallback(() => {
    const t = triggerRef.current;
    const l = listRef.current;
    if (!t || !l) return;
    const r = t.getBoundingClientRect();
    const margin = 8;
    const listH = l.scrollHeight;
    const below = window.innerHeight - r.bottom - margin;
    const above = r.top - margin;
    const flipUp = listH > below && above > below;
    const space = flipUp ? above : below;
    setPos({
      top: flipUp ? undefined : Math.round(r.bottom + 6),
      bottom: flipUp ? Math.round(window.innerHeight - r.top + 6) : undefined,
      left: align === 'start' ? Math.round(r.left) : undefined,
      right: align === 'end' ? Math.round(window.innerWidth - r.right) : undefined,
      maxHeight: Math.max(140, Math.min(space - 6, 480)),
    });
  }, [align]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  // Clear the cached position on close so the next open re-measures from scratch.
  useEffect(() => {
    if (!open) setPos(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    // Keep the popover anchored to the trigger as the page (or a scroll container,
    // e.g. the inspector popover auto-scrolling the focused trigger into view on
    // open) moves under it, rather than letting it detach or snap shut.
    let raf = 0;
    const onReflow = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, place]);

  return (
    <div className="ox-dd" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName ?? 'ox-dd-trigger'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {button}
      </button>
      {open
        ? createPortal(
            <div
              ref={listRef}
              className="ox-dd-list ox-dd-list--fixed"
              role="menu"
              style={
                pos
                  ? { position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, maxHeight: pos.maxHeight }
                  : { position: 'fixed', top: 0, left: -9999, visibility: 'hidden' }
              }
            >
              {items.map((it, i) =>
                'separator' in it ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static menu list
                  <div key={i} className="ox-dd-sep" role="separator" />
                ) : (
                  <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: static menu list
                    key={i}
                    type="button"
                    role={it.checked === undefined ? 'menuitem' : 'menuitemradio'}
                    aria-checked={it.checked === undefined ? undefined : it.checked}
                    className={`ox-dd-item${it.danger ? ' is-danger' : ''}${it.checked ? ' is-checked' : ''}`}
                    disabled={it.disabled}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpen(false);
                      it.onSelect();
                    }}
                  >
                    {it.icon ? <Icon name={it.icon} size={15} /> : null}
                    <span className="ox-dd-label">{it.label}</span>
                    {it.checked ? <Icon name="check" size={15} className="ox-dd-tick" /> : null}
                  </button>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * Single-choice dropdown — the styled replacement for a native <select>. Shows the
 * current option's label + caret as the trigger and a check beside the active item.
 */
export function SelectMenu<T extends string | number>({
  value,
  options,
  onChange,
  align = 'start',
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  align?: 'start' | 'end';
  label?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Menu
      label={label}
      align={align}
      triggerClassName="ox-select"
      button={
        <>
          <span className="ox-select-val">{current?.label ?? ''}</span>
          <Icon name="caret" size={14} />
        </>
      }
      items={options.map((o) => ({
        label: o.label,
        checked: o.value === value,
        onSelect: () => onChange(o.value),
      }))}
    />
  );
}
