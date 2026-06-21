import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../icons';

/**
 * Click-to-open dropdown menu (also serves as a context/action menu). Closes on
 * outside-click and Esc. Items are data, not children, so callers stay terse.
 */
export type MenuItem =
  | { separator: true }
  | {
      label: string;
      icon?: IconName;
      onSelect: () => void;
      danger?: boolean;
      disabled?: boolean;
    };

export function Menu({
  button,
  items,
  align = 'end',
  label,
}: {
  button: ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div className="ox-dd" ref={wrapRef}>
      <button
        type="button"
        className="ox-dd-trigger"
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
      {open ? (
        <div className={`ox-dd-list ox-dd-list--${align}`} role="menu">
          {items.map((it, i) =>
            'separator' in it ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: static menu list
              <div key={i} className="ox-dd-sep" role="separator" />
            ) : (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: static menu list
                key={i}
                type="button"
                role="menuitem"
                className={`ox-dd-item${it.danger ? ' is-danger' : ''}`}
                disabled={it.disabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  it.onSelect();
                }}
              >
                {it.icon ? <Icon name={it.icon} size={15} /> : null}
                <span>{it.label}</span>
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
