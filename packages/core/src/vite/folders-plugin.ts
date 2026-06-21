import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Folders / collections (dev only). A `designs/.folders.json` manifest groups
 * designs; the workspace sidebar reads it and can filter by folder.
 *   GET    /__ox/folders                manifest
 *   POST   /__ox/folders                create { name, icon? } -> { id }
 *   PATCH  /__ox/folders/<id>           update { name?, icon? }
 *   DELETE /__ox/folders/<id>           remove folder (+ its assignments)
 *   PUT    /__ox/folders/assign         { design, folder|null }
 */
interface Folder {
  id: string;
  name: string;
  icon?: string;
}
interface Manifest {
  folders: Folder[];
  assignments: Record<string, string>; // designId -> folderId
}

const MAX = 100_000;

function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) return false;
    } catch {
      return false;
    }
  }
  const site = req.headers['sec-fetch-site'];
  if (typeof site === 'string' && site !== 'same-origin' && site !== 'none') return false;
  return true;
}

function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      raw += c;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const slug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'folder';

export function foldersPlugin(opts: { designsRoot: string }): Plugin {
  const { designsRoot } = opts;
  const file = path.join(designsRoot, '.folders.json');

  const read = (): Manifest => {
    try {
      const m = JSON.parse(readFileSync(file, 'utf8'));
      return { folders: Array.isArray(m.folders) ? m.folders : [], assignments: m.assignments ?? {} };
    } catch {
      return { folders: [], assignments: {} };
    }
  };
  const write = (m: Manifest) => {
    mkdirSync(designsRoot, { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(m, null, 2), 'utf8');
    renameSync(tmp, file);
  };

  return {
    name: 'opencanva-folders',
    apply: 'serve',
    configureServer(server) {
      const json = (res: ServerResponse, code: number, body: unknown) => {
        res.statusCode = code;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(body));
      };
      const changed = () => {
        try {
          server.ws.send({ type: 'custom', event: 'opencanva:folders-changed', data: {} });
        } catch {
          /* best-effort */
        }
      };

      server.middlewares.use('/__ox/folders', (req, res, next) => {
        const url = new URL(req.url ?? '', 'http://localhost');
        const method = req.method ?? 'GET';

        if (method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
          return json(res, 200, read());
        }
        if (!sameOrigin(req) || req.headers['x-opencanva-write'] !== '1') return json(res, 403, { error: 'Forbidden: cross-origin or unauthorized write rejected' });

        if (method === 'POST' && (url.pathname === '/' || url.pathname === '')) {
          readJson(req)
            .then((body) => {
              const name = String(body?.name ?? '').trim().slice(0, 40);
              if (!name) return json(res, 400, { error: 'name required' });
              const m = read();
              let id = slug(name);
              for (let i = 2; m.folders.some((f) => f.id === id); i++) id = `${slug(name)}-${i}`;
              m.folders.push({ id, name, icon: typeof body?.icon === 'string' ? body.icon.slice(0, 8) : undefined });
              write(m);
              changed();
              json(res, 200, { ok: true, id });
            })
            .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
          return;
        }

        if (method === 'PUT' && url.pathname === '/assign') {
          readJson(req)
            .then((body) => {
              const design = String(body?.design ?? '');
              const folder = body?.folder == null ? null : String(body.folder);
              if (!/^[A-Za-z0-9][\w-]*$/.test(design)) return json(res, 400, { error: 'invalid design id' });
              const m = read();
              if (folder && !m.folders.some((f) => f.id === folder)) return json(res, 404, { error: 'folder not found' });
              if (folder) m.assignments[design] = folder;
              else delete m.assignments[design];
              write(m);
              changed();
              json(res, 200, { ok: true });
            })
            .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
          return;
        }

        const idm = /^\/([^/]+)\/?$/.exec(url.pathname);
        if (idm) {
          const id = decodeURIComponent(idm[1]);
          if (method === 'DELETE') {
            const m = read();
            m.folders = m.folders.filter((f) => f.id !== id);
            for (const k of Object.keys(m.assignments)) if (m.assignments[k] === id) delete m.assignments[k];
            write(m);
            changed();
            return json(res, 200, { ok: true });
          }
          if (method === 'PATCH') {
            readJson(req)
              .then((body) => {
                const m = read();
                const f = m.folders.find((x) => x.id === id);
                if (!f) return json(res, 404, { error: 'folder not found' });
                if (typeof body?.name === 'string') f.name = body.name.trim().slice(0, 40) || f.name;
                if (typeof body?.icon === 'string') f.icon = body.icon.slice(0, 8);
                write(m);
                changed();
                json(res, 200, { ok: true });
              })
              .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
            return;
          }
        }
        return next();
      });
    },
  };
}
