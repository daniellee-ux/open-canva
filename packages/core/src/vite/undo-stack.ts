import { readFileSync, writeFileSync } from 'node:fs';

/**
 * A single source-edit history shared by every dev write endpoint. The inspector
 * (string-splice prop/text/style edits), the design API (board duplicate/delete/
 * reorder, token edits, meta rename) and any future writer push onto the SAME
 * timeline — otherwise a board edit done after an inspector edit is silently
 * destroyed by the next Cmd+Z (which restores the inspector's last snapshot).
 *
 * Each entry is a full-file `before` snapshot, so undo/redo is just a file swap;
 * `applyWrite` captures `before` itself, so callers only supply the next text.
 */
export interface UndoStack {
  /** Write `next` to `abs`, snapshotting the prior content for undo. A repeated
   *  write with the same `coalesceKey` within 700ms folds into the previous entry
   *  (slider drags / repeated nudges → one undo step). */
  applyWrite(abs: string, next: string, coalesceKey?: string): void;
  /** Revert the most recent write; returns the file it touched (null if empty). */
  undo(): { file: string } | null;
  /** Re-apply the most recently undone write; null if the redo stack is empty. */
  redo(): { file: string } | null;
  depths(): { undo: number; redo: number };
}

export function createUndoStack(): UndoStack {
  const undoStack: { file: string; before: string }[] = [];
  const redoStack: { file: string; before: string }[] = [];
  let lastWrite: { key: string; time: number } | null = null;

  const applyWrite = (abs: string, next: string, coalesceKey?: string) => {
    const before = readFileSync(abs, 'utf8');
    const now = Date.now();
    const top = undoStack[undoStack.length - 1];
    const coalesce =
      !!coalesceKey && !!lastWrite && lastWrite.key === coalesceKey && now - lastWrite.time < 700 && !!top && top.file === abs;
    if (!coalesce) undoStack.push({ file: abs, before });
    redoStack.length = 0;
    writeFileSync(abs, next, 'utf8');
    lastWrite = coalesceKey ? { key: coalesceKey, time: now } : null;
  };

  const undo = (): { file: string } | null => {
    const entry = undoStack.pop();
    if (!entry) return null;
    const current = readFileSync(entry.file, 'utf8');
    redoStack.push({ file: entry.file, before: current });
    writeFileSync(entry.file, entry.before, 'utf8');
    lastWrite = null; // an undo breaks any coalescing run
    return { file: entry.file };
  };

  const redo = (): { file: string } | null => {
    const entry = redoStack.pop();
    if (!entry) return null;
    const current = readFileSync(entry.file, 'utf8');
    undoStack.push({ file: entry.file, before: current });
    writeFileSync(entry.file, entry.before, 'utf8');
    lastWrite = null;
    return { file: entry.file };
  };

  const depths = () => ({ undo: undoStack.length, redo: redoStack.length });

  return { applyWrite, undo, redo, depths };
}
