import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal-based modal dialog in the editor-chrome token language. Esc and
 * scrim-click close; the first focusable field in the body is auto-focused
 * (and selected, if a text input). Used for rename / delete / move / conflict.
 */
export function Dialog({
  open,
  onClose,
  eyebrow,
  title,
  description,
  children,
  footer,
  width = 420,
  autoFocus = true,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
  autoFocus?: boolean;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Capture-phase so Esc closes the dialog before deeper handlers (e.g. the
    // inspector's keydown) also react to the key.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    if (autoFocus) {
      queueMicrotask(() => {
        const el = bodyRef.current?.querySelector<HTMLElement>('input, textarea, select, button');
        el?.focus();
        if (el instanceof HTMLInputElement && el.type !== 'color') el.select();
      });
    }
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose, autoFocus]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="ox-dialog-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ox-dialog" role="dialog" aria-modal="true" style={{ width }}>
        {eyebrow ? <span className="ox-dialog-eyebrow">{eyebrow}</span> : null}
        {title ? <h2 className="ox-dialog-title">{title}</h2> : null}
        {description ? <p className="ox-dialog-desc">{description}</p> : null}
        <div className="ox-dialog-body" ref={bodyRef}>
          {children}
        </div>
        {footer ? <div className="ox-dialog-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
