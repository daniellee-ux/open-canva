import { readFileSync, writeFileSync } from 'node:fs';

/**
 * A single source-edit history shared by every dev write endpoint. The inspector
 * (string-splice prop/text/style edits), the design API (board duplicate/delete/
 * reorder, token edits, meta rename) and any future writer push onto the SAME
 * timeline — otherwise a board edit done after an inspector edit is silently
 * destroyed by the next Cmd+Z (which restores the inspector's last snapshot).
 *
 * Each entry is a TRANSACTION: one or more full-file `before` snapshots that
 * undo/redo as a single step. A normal write is a one-file transaction; a
 * cross-file batch (a multi-object move/delete spanning sibling component files)
 * is one transaction so a single Cmd+Z reverts every file it touched together.
 */
interface Snapshot {
  file: string;
  before: string;
}
interface Entry {
  files: Snapshot[];
}

export interface UndoStack {
  /** Write `next` to `abs`, snapshotting the prior content for undo. A repeated
   *  write with the same `coalesceKey` within 700ms folds into the previous entry
   *  (slider drags / repeated nudges → one undo step). */
  applyWrite(abs: string, next: string, coalesceKey?: string): void;
  /** Write several files as ONE undo step — a multi-file batch reverts together. */
  applyBatch(writes: { abs: string; next: string }[]): void;
  /** Revert the most recent transaction; returns every file it touched (null if empty). */
  undo(): { files: string[] } | null;
  /** Re-apply the most recently undone transaction; null if the redo stack is empty. */
  redo(): { files: string[] } | null;
  depths(): { undo: number; redo: number };
}

export function createUndoStack(): UndoStack {
  const undoStack: Entry[] = [];
  const redoStack: Entry[] = [];
  let lastWrite: { key: string; time: number } | null = null;

  const applyWrite = (abs: string, next: string, coalesceKey?: string) => {
    const before = readFileSync(abs, 'utf8');
    const now = Date.now();
    const top = undoStack[undoStack.length - 1];
    // Only coalesce into a prior single-file transaction for the same file.
    const coalesce =
      !!coalesceKey &&
      !!lastWrite &&
      lastWrite.key === coalesceKey &&
      now - lastWrite.time < 700 &&
      !!top &&
      top.files.length === 1 &&
      top.files[0].file === abs;
    if (!coalesce) undoStack.push({ files: [{ file: abs, before }] });
    redoStack.length = 0;
    writeFileSync(abs, next, 'utf8');
    lastWrite = coalesceKey ? { key: coalesceKey, time: now } : null;
  };

  const applyBatch = (writes: { abs: string; next: string }[]) => {
    if (!writes.length) return;
    // Snapshot every file BEFORE writing any, so the whole batch is one undo step.
    const files = writes.map((w) => ({ file: w.abs, before: readFileSync(w.abs, 'utf8') }));
    undoStack.push({ files });
    redoStack.length = 0;
    for (const w of writes) writeFileSync(w.abs, w.next, 'utf8');
    lastWrite = null; // a batch is never coalesced into
  };

  const revert = (from: Entry[], to: Entry[]): { files: string[] } | null => {
    const entry = from.pop();
    if (!entry) return null;
    // Capture current content as the inverse transaction before overwriting.
    const current = entry.files.map((f) => ({ file: f.file, before: readFileSync(f.file, 'utf8') }));
    to.push({ files: current });
    for (const f of entry.files) writeFileSync(f.file, f.before, 'utf8');
    lastWrite = null; // an undo/redo breaks any coalescing run
    return { files: entry.files.map((f) => f.file) };
  };

  const undo = () => revert(undoStack, redoStack);
  const redo = () => revert(redoStack, undoStack);

  const depths = () => ({ undo: undoStack.length, redo: redoStack.length });

  return { applyWrite, applyBatch, undo, redo, depths };
}
