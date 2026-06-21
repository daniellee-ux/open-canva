import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { parse } from '@babel/parser';
import type { Plugin } from 'vite';
import type { UndoStack } from './undo-stack';

/**
 * Design + board lifecycle (dev only). Mutates the `designs/` tree; the
 * opencanva plugin's watcher then refreshes the design list / re-renders.
 *   PATCH  /__ox/design/<id>            rename meta.title (JSON { title })
 *   POST   /__ox/design/<id>/duplicate  copy the folder to a new id
 *   DELETE /__ox/design/<id>            remove the folder
 *   POST   /__ox/board/<id>/<i>/duplicate   duplicate board i
 *   DELETE /__ox/board/<id>/<i>             delete board i
 *   PUT    /__ox/board/<id>/reorder         reorder boards (JSON { order:number[] })
 */
const DESIGN_RE = /^[A-Za-z0-9][\w-]*$/;
const MAX = 200_000;

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

function parseFile(code: string) {
  return parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
}
function wouldParse(code: string): boolean {
  try {
    parseFile(code);
    return true;
  } catch {
    return false;
  }
}

/** The `export default [ ... ]` scene array: its span + each element's span. */
function findSceneArray(ast: any): { start: number; end: number; els: { start: number; end: number }[] } | null {
  for (const node of ast.program?.body ?? []) {
    if (node.type === 'ExportDefaultDeclaration' && node.declaration?.type === 'ArrayExpression') {
      const arr = node.declaration;
      const els = (arr.elements ?? [])
        .filter((e: any) => e && typeof e.start === 'number' && typeof e.end === 'number')
        .map((e: any) => ({ start: e.start, end: e.end }));
      return { start: arr.start, end: arr.end, els };
    }
  }
  return null;
}

/** Replace (or insert / remove) the `export const design = …` token object. */
function rewriteDesignExport(code: string, ast: any, literal: string | null): string {
  for (const node of ast.program?.body ?? []) {
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
      for (const d of node.declaration.declarations ?? []) {
        if (d.id?.name === 'design' && d.init) {
          if (literal == null) {
            let end = node.end;
            while (code[end] === '\n') end++;
            return code.slice(0, node.start) + code.slice(end);
          }
          return code.slice(0, d.init.start) + literal + code.slice(d.init.end);
        }
      }
    }
  }
  if (literal == null) return code; // nothing to reset
  let insertAt = 0;
  for (const node of ast.program?.body ?? []) {
    if (node.type === 'ImportDeclaration') insertAt = node.end;
  }
  return `${code.slice(0, insertAt)}\n\nexport const design = ${literal};\n${code.slice(insertAt)}`;
}

/** Replace the value of `export const meta`'s `title` (or insert it). */
function rewriteMetaTitle(code: string, ast: any, title: string): string | null {
  const lit = JSON.stringify(title);
  for (const node of ast.program?.body ?? []) {
    const decl =
      node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration'
        ? node.declaration
        : null;
    if (!decl) continue;
    for (const d of decl.declarations ?? []) {
      if (d.id?.name !== 'meta' || d.init?.type !== 'ObjectExpression') continue;
      const obj = d.init;
      for (const prop of obj.properties ?? []) {
        const key = prop.key?.name ?? prop.key?.value;
        if (prop.type === 'ObjectProperty' && key === 'title' && prop.value) {
          return code.slice(0, prop.value.start) + lit + code.slice(prop.value.end);
        }
      }
      // No title yet — insert right after `{`.
      return `${code.slice(0, obj.start + 1)} title: ${lit},${code.slice(obj.start + 1)}`;
    }
  }
  return null; // no meta export
}

export function designApiPlugin(opts: { designsRoot: string; undoStack: UndoStack }): Plugin {
  const { designsRoot, undoStack } = opts;
  return {
    name: 'opencanva-design-api',
    apply: 'serve',
    configureServer(server) {
      const json = (res: ServerResponse, code: number, body: unknown) => {
        res.statusCode = code;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(body));
      };
      const indexFile = (id: string): string | null => {
        if (!DESIGN_RE.test(id)) return null;
        const dir = path.join(designsRoot, id);
        for (const ext of ['tsx', 'jsx', 'ts', 'js']) {
          const f = path.join(dir, `index.${ext}`);
          if (existsSync(f)) return f;
        }
        return null;
      };
      const editBoardArray = (
        id: string,
        res: ServerResponse,
        transform: (texts: string[]) => string[] | { error: string },
      ) => {
        const file = indexFile(id);
        if (!file) return json(res, 404, { error: 'design not found' });
        const code = readFileSync(file, 'utf8');
        const arr = findSceneArray(parseFile(code));
        if (!arr) return json(res, 422, { error: 'No `export default [...]` board array found' });
        const texts = arr.els.map((e) => code.slice(e.start, e.end));
        const result = transform(texts);
        if (!Array.isArray(result)) return json(res, 400, { error: result.error });
        const next = code.slice(0, arr.start) + `[${result.join(', ')}]` + code.slice(arr.end);
        if (!wouldParse(next)) return json(res, 422, { error: 'Edit would break the file; not written.' });
        // Through the shared undo stack so a board op joins the inspector's Cmd+Z timeline.
        undoStack.applyWrite(file, next);
        json(res, 200, { ok: true, count: result.length });
      };

      server.middlewares.use('/__ox/design', (req, res, next) => {
        const url = new URL(req.url ?? '', 'http://localhost');

        // Live design-token editing: PUT .../tokens (full design object) / POST .../tokens/reset
        const tok = /^\/([^/]+)\/tokens(?:\/(reset))?\/?$/.exec(url.pathname);
        if (tok) {
          if (!sameOrigin(req) || req.headers['x-opencanva-write'] !== '1') return json(res, 403, { error: 'Forbidden: cross-origin or unauthorized write rejected' });
          const id = decodeURIComponent(tok[1]);
          const file = indexFile(id);
          if (!file) return json(res, 404, { error: 'design not found' });
          const isReset = tok[2] === 'reset' && (req.method === 'POST' || req.method === 'PUT');
          if (!isReset && req.method !== 'PUT') return next();
          readJson(req)
            .then((body) => {
              let literal: string | null = null;
              if (!isReset) {
                const d = body?.design ?? body;
                if (!d || typeof d !== 'object' || typeof d.palette !== 'object') {
                  return json(res, 400, { error: 'expected a design object with a palette' });
                }
                literal = JSON.stringify(d, null, 2);
              }
              const code = readFileSync(file, 'utf8');
              const out = rewriteDesignExport(code, parseFile(code), literal);
              if (!wouldParse(out)) return json(res, 422, { error: 'Edit would break the file; not written.' });
              undoStack.applyWrite(file, out);
              json(res, 200, { ok: true, reset: isReset });
            })
            .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
          return;
        }

        const m = /^\/([^/]+)(?:\/(duplicate))?\/?$/.exec(url.pathname);
        if (!m) return next();
        const method = req.method ?? 'GET';
        if (method !== 'PATCH' && method !== 'POST' && method !== 'DELETE') return next();
        if (!sameOrigin(req) || req.headers['x-opencanva-write'] !== '1') return json(res, 403, { error: 'Forbidden: cross-origin or unauthorized write rejected' });
        const id = decodeURIComponent(m[1]);
        if (!DESIGN_RE.test(id)) return json(res, 400, { error: 'invalid design id' });
        const dir = path.join(designsRoot, id);

        if (method === 'DELETE') {
          if (!existsSync(dir)) return json(res, 404, { error: 'not found' });
          try {
            rmSync(dir, { recursive: true, force: true });
            return json(res, 200, { ok: true });
          } catch (err) {
            return json(res, 500, { error: String((err as Error)?.message ?? err) });
          }
        }

        if (method === 'POST' && m[2] === 'duplicate') {
          if (!existsSync(dir)) return json(res, 404, { error: 'not found' });
          let copy = `${id}-copy`;
          for (let i = 2; existsSync(path.join(designsRoot, copy)); i++) copy = `${id}-copy-${i}`;
          try {
            cpSync(dir, path.join(designsRoot, copy), { recursive: true });
            return json(res, 200, { ok: true, id: copy });
          } catch (err) {
            return json(res, 500, { error: String((err as Error)?.message ?? err) });
          }
        }

        if (method === 'PATCH') {
          const file = indexFile(id);
          if (!file) return json(res, 404, { error: 'not found' });
          readJson(req)
            .then((body) => {
              const title = String(body?.title ?? '').slice(0, 200);
              if (!title.trim()) return json(res, 400, { error: 'empty title' });
              const code = readFileSync(file, 'utf8');
              const out = rewriteMetaTitle(code, parseFile(code), title);
              if (out == null) return json(res, 422, { error: 'No `export const meta` to rename. Add one first.' });
              if (!wouldParse(out)) return json(res, 422, { error: 'Edit would break the file; not written.' });
              undoStack.applyWrite(file, out);
              json(res, 200, { ok: true, title });
            })
            .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
          return;
        }
        return next();
      });

      server.middlewares.use('/__ox/board', (req, res, next) => {
        const url = new URL(req.url ?? '', 'http://localhost');
        const method = req.method ?? 'GET';
        if (!sameOrigin(req) || req.headers['x-opencanva-write'] !== '1') return json(res, 403, { error: 'Forbidden: cross-origin or unauthorized write rejected' });

        const reorder = /^\/([^/]+)\/reorder\/?$/.exec(url.pathname);
        if (reorder && method === 'PUT') {
          const id = decodeURIComponent(reorder[1]);
          readJson(req)
            .then((body) => {
              const order = Array.isArray(body?.order) ? (body.order as number[]) : null;
              editBoardArray(id, res, (texts) => {
                if (!order || order.length !== texts.length || new Set(order).size !== texts.length || order.some((i) => i < 0 || i >= texts.length)) {
                  return { error: 'order must be a permutation of board indices' };
                }
                return order.map((i) => texts[i]);
              });
            })
            .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
          return;
        }

        const item = /^\/([^/]+)\/(\d+)(?:\/(duplicate))?\/?$/.exec(url.pathname);
        if (!item) return next();
        const id = decodeURIComponent(item[1]);
        const idx = Number(item[2]);
        if (method === 'POST' && item[3] === 'duplicate') {
          editBoardArray(id, res, (texts) => {
            if (idx < 0 || idx >= texts.length) return { error: 'board index out of range' };
            const out = [...texts];
            out.splice(idx + 1, 0, texts[idx]);
            return out;
          });
          return;
        }
        if (method === 'DELETE') {
          editBoardArray(id, res, (texts) => {
            if (texts.length <= 1) return { error: 'Cannot delete the last board' };
            if (idx < 0 || idx >= texts.length) return { error: 'board index out of range' };
            return texts.filter((_, i) => i !== idx);
          });
          return;
        }
        return next();
      });
    },
  };
}
