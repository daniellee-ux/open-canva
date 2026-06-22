import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '../icons';

/**
 * Global, imperative toast — call `toast.ok('saved')` from anywhere (no context
 * plumbing) and a single `<ToastHost/>` mounted at the app root renders the stack.
 * Replaces the inspector's bespoke single-toast so there's one notification system.
 */
type ToastKind = 'ok' | 'err' | 'info';
type ToastItem = { id: number; kind: ToastKind; msg: string };

const GLYPH: Record<ToastKind, IconName> = { ok: 'check', err: 'warn', info: 'comment' };

let seq = 0;
let items: ToastItem[] = [];
const listeners = new Set<(i: ToastItem[]) => void>();
const emit = () => {
  for (const l of listeners) l(items);
};

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(kind: ToastKind, msg: string, ttl: number) {
  const id = ++seq;
  items = [...items, { id, kind, msg }];
  emit();
  if (ttl > 0) setTimeout(() => dismiss(id), ttl);
  return id;
}

export const toast = {
  ok: (msg: string) => push('ok', msg, 2800),
  err: (msg: string) => push('err', msg, 4600),
  info: (msg: string) => push('info', msg, 2800),
  dismiss,
};

export function ToastHost() {
  const [list, setList] = useState<ToastItem[]>(items);
  useEffect(() => {
    listeners.add(setList);
    setList(items);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="ox-toasts">
      {list.map((t) => (
        <div
          key={t.id}
          className={`ox-toast ox-toast--${t.kind}`}
          role={t.kind === 'err' ? 'alert' : 'status'}
          onClick={() => dismiss(t.id)}
        >
          <span className="ox-toast-glyph" aria-hidden>
            <Icon name={GLYPH[t.kind]} size={14} />
          </span>
          {t.msg}
        </div>
      ))}
    </div>,
    document.body,
  );
}
