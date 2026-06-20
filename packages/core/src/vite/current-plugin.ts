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
export function currentPlugin(opts: { userCwd: string }): Plugin {
  const dir = path.join(opts.userCwd, '.opencanva');
  const file = path.join(dir, 'current.json');
  return {
    name: 'opencanva-current',
    configureServer(server) {
      server.ws.on('opencanva:current', (data: Record<string, unknown>) => {
        try {
          mkdirSync(dir, { recursive: true });
          const payload = JSON.stringify(
            { ...data, updatedAt: new Date().toISOString() },
            null,
            2,
          );
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
