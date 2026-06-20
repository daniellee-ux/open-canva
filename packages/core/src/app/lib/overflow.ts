/**
 * Dev-time layout check: finds objects whose RENDERED content spills past the
 * box that contains them — e.g. a caption that wrapped to more lines than its
 * card has room for. The inspector frames objects by their declared x/y/w/h and
 * never compares that to what actually rendered, so this class of bug is
 * otherwise invisible until you eyeball it. Measured from live geometry, so it
 * accounts for real fonts/wrapping. Surfaced via `window.__ox.overflow()` and a
 * console warning on load (see app.tsx).
 */
export interface OverflowIssue {
  /** Object primitive type (text, box, …). */
  type: string;
  /** Short label — text content for text objects, else the type. */
  label: string;
  /** How far the content spills past its container, in artboard px. */
  bottom: number;
  right: number;
}

// Below this (artboard px) is line-box padding noise, not a visible spill.
const THRESHOLD = 6;

export function findOverflows(root: ParentNode = document): OverflowIssue[] {
  const issues: OverflowIssue[] = [];
  const canvas = root.querySelector<HTMLElement>('.ox-canvas');
  const zoom = Number(canvas?.getAttribute('data-ox-zoom')) || 1;

  root.querySelectorAll<HTMLElement>('.ox-board [data-ox-obj]').forEach((el) => {
    // A rotated object (or rotated container) makes axis-aligned bounds
    // unreliable — its frame is rotated too, so skip rather than false-flag.
    const parent = el.parentElement?.closest<HTMLElement>('[data-ox-obj]');
    if (!parent || parent.getAttribute('data-ox-type') !== 'box') return;
    if (/rotate/.test(el.style.transform) || /rotate/.test(parent.style.transform)) return;

    const pr = parent.getBoundingClientRect();
    const cr = el.getBoundingClientRect();
    const bottom = (cr.bottom - pr.bottom) / zoom;
    const right = (cr.right - pr.right) / zoom;
    if (bottom <= THRESHOLD && right <= THRESHOLD) return;

    const type = el.getAttribute('data-ox-type') || 'object';
    issues.push({
      type,
      label: type === 'text' ? (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 48) : type,
      bottom: Math.max(0, Math.round(bottom)),
      right: Math.max(0, Math.round(right)),
    });
  });
  return issues;
}
