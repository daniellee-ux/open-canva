import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Writes `.opencanva/current.json` whenever the editor's view changes — the data
 * source for the `current-design` skill. The client sends `opencanva:current`
 * over the HMR socket with the design id, active scene, zoom, and any inspector
 * selection (file/line/tag of the clicked object). Replaces open-slide's
 * pageIndex cursor with a design/scene/object cursor.
 */
const VIEWS = ['view', 'inspect', 'assets', 'tokens'] as const;

const str = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' ? v.slice(0, max) : undefined;
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/** Whitelist + clamp the client cursor, never trust raw socket input on disk. */
function sanitizeCursor(data: Record<string, unknown>) {
  const sel = data.selection && typeof data.selection === 'object' ? (data.selection as Record<string, unknown>) : null;
  const view = typeof data.view === 'string' && (VIEWS as readonly string[]).includes(data.view) ? data.view : 'view';
  return {
    designId: str(data.designId, 200),
    title: str(data.title, 300),
    activeBoard: num(data.activeBoard),
    board: str(data.board, 200),
    zoom: num(data.zoom),
    view,
    selection: sel
      ? { rel: str(sel.rel, 300), line: num(sel.line), column: num(sel.column), tag: str(sel.tag, 80) }
      : null,
    updatedAt: new Date().toISOString(),
  };
}

export function currentPlugin(opts: { userCwd: string }): Plugin {
  const dir = path.join(opts.userCwd, '.opencanva');
  const file = path.join(dir, 'current.json');
  return {
    name: 'opencanva-current',
    apply: 'serve', // dev-only cursor; never participates in the production build
    configureServer(server) {
      server.ws.on('opencanva:current', (data: Record<string, unknown>) => {
        try {
          mkdirSync(dir, { recursive: true });
          const payload = JSON.stringify(sanitizeCursor(data ?? {}), null, 2);
          const tmp = `${file}.tmp`;
          writeFileSync(tmp, payload, 'utf8');
          renameSync(tmp, file); // atomic
        } catch {
          // best-effort; never crash the dev server over a cursor write
        }
      });
    },
  };
}
