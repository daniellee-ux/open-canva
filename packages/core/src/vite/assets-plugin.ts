import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import fg from 'fast-glob';
import { normalizePath, type Plugin } from 'vite';

/**
 * Assets API for `designs/<id>/assets/` — the in-app assets panel reads it to
 * show + manage a design's files (logos, photos, textures).
 *   GET    /__ox/assets?design=<id>          list
 *   POST   /__ox/assets/<id>/<file>          upload (raw body; ?overwrite=1 to replace)
 *   PATCH  /__ox/assets/<id>/<file>          rename  (JSON { to })
 *   DELETE /__ox/assets/<id>/<file>          delete
 * Writes are same-origin-guarded and confined to the design's assets dir.
 */
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif']);
const MAX_UPLOAD = 25 * 1024 * 1024; // 25 MB
const DESIGN_RE = /^[A-Za-z0-9][\w-]*$/;
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function validName(name: string): boolean {
  if (!NAME_RE.test(name) || name.includes('..')) return false;
  return IMAGE_EXTS.has(path.extname(name).slice(1).toLowerCase());
}

/**
 * Sniff the uploaded bytes against the claimed extension so arbitrary content
 * can't be stored under an image name (the file is served verbatim via /@fs).
 * Raster formats are checked by magic number. SVG must look like XML/SVG once any
 * leading BOM / XML declaration / comments are stripped, and carries no inline
 * <script>, event-handler attribute, or javascript: URI. (Safety today rests on
 * every consumer rendering assets via <img> — a non-executing context; these
 * checks are defense in depth should a future consumer inline the markup.)
 */
function contentMatchesExt(ext: string, b: Buffer): boolean {
  const starts = (sig: number[]) => sig.length <= b.length && sig.every((v, i) => b[i] === v);
  const ascii = (start: number, end: number) => b.subarray(start, end).toString('latin1');
  switch (ext) {
    case 'png':
      return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'jpg':
    case 'jpeg':
      return starts([0xff, 0xd8, 0xff]);
    case 'gif':
      return ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a';
    case 'webp':
      return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'avif':
      return ascii(4, 8) === 'ftyp' && /avif|avis|mif1|miaf/.test(ascii(8, 24));
    case 'svg': {
      const head = b
        .subarray(0, 2048)
        .toString('utf8')
        .replace(/^\uFEFF/, "")
        // Strip a leading XML declaration, processing instructions, comments, and
        // whitespace so a valid SVG that opens with a generator/license comment
        // (Illustrator/optimizer output) still passes the root-element check.
        .replace(/^(?:<!--[\s\S]*?-->|<\?[\s\S]*?\?>|\s)+/, '')
        .toLowerCase();
      if (!(head.startsWith('<svg') || head.startsWith('<!doctype svg'))) return false;
      const full = b.toString('utf8');
      return !/<script[\s/>]/i.test(full) && !/\son\w+\s*=/i.test(full) && !/javascript:/i.test(full);
    }
    default:
      return false;
  }
}

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

function readRaw(req: IncomingMessage, max: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > max) {
        reject(new Error('too-large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
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

export function assetsPlugin(opts: { designsRoot: string }): Plugin {
  const { designsRoot } = opts;
  return {
    name: 'opencanva-assets',
    apply: 'serve',
    configureServer(server) {
      const json = (res: ServerResponse, code: number, body: unknown) => {
        res.statusCode = code;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(body));
      };
      const assetInfo = (dir: string, name: string) => {
        const abs = path.join(dir, name);
        const ext = path.extname(name).slice(1).toLowerCase();
        const st = statSync(abs);
        return { name, ext, size: st.size, mtime: st.mtimeMs, isImage: IMAGE_EXTS.has(ext), url: `/@fs${normalizePath(abs)}` };
      };
      // Resolve + confine `<design>/<file>` to the design's assets dir.
      const resolveItem = (design: string, file: string): { dir: string; abs: string } | null => {
        if (!DESIGN_RE.test(design) || !validName(file)) return null;
        const dir = path.join(designsRoot, design, 'assets');
        const abs = path.join(dir, file);
        if (abs !== path.normalize(abs) || !abs.startsWith(dir + path.sep)) return null;
        return { dir, abs };
      };
      const changed = (design: string) => {
        try {
          server.ws.send({ type: 'custom', event: 'opencanva:assets-changed', data: { design } });
        } catch {
          /* best-effort */
        }
      };

      server.middlewares.use('/__ox/assets', (req, res, next) => {
        const url = new URL(req.url ?? '', 'http://localhost');
        const method = req.method ?? 'GET';

        // GET list: /__ox/assets?design=<id>
        if (method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
          const design = url.searchParams.get('design') ?? '';
          if (!DESIGN_RE.test(design)) return json(res, 400, { error: 'invalid design id' });
          const dir = path.join(designsRoot, design, 'assets');
          // Concatenate the design's source once to count asset references.
          let src = '';
          try {
            for (const f of fg.sync('**/*.{tsx,jsx,ts,js}', { cwd: path.join(designsRoot, design), absolute: true })) {
              src += `${readFileSync(f, 'utf8')}\n`;
            }
          } catch {
            /* best-effort usage scan */
          }
          const usesOf = (name: string) => {
            const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Anchor the end to a name terminator so `logo.png` doesn't count inside
            // a longer sibling like `logo.png2.png` or `logo.png.bak`.
            return (src.match(new RegExp(`assets/${esc}(?![\\w.-])`, 'g')) ?? []).length;
          };
          const files = existsSync(dir)
            ? readdirSync(dir)
                .filter((f) => !f.startsWith('.'))
                .map((name) => ({ ...assetInfo(dir, name), uses: usesOf(name) }))
                .sort((a, b) => a.name.localeCompare(b.name))
            : [];
          return json(res, 200, { design, dir: `designs/${design}/assets`, files });
        }

        // Item routes: /__ox/assets/<design>/<file>
        const m = /^\/([^/]+)\/([^/]+)\/?$/.exec(url.pathname);
        if (!m) return next();
        if (method !== 'POST' && method !== 'PATCH' && method !== 'DELETE') return next();
        // Same-origin AND a custom header — the header forces a CORS preflight a
        // cross-origin page can't satisfy (the raw-upload path can't use JSON content-type).
        if (!sameOrigin(req) || req.headers['x-opencanva-write'] !== '1') {
          return json(res, 403, { error: 'Forbidden: cross-origin or unauthorized write rejected' });
        }
        const design = decodeURIComponent(m[1]);
        const file = decodeURIComponent(m[2]);
        const loc = resolveItem(design, file);
        if (!loc) return json(res, 400, { error: 'invalid design or filename' });

        if (method === 'POST') {
          const overwrite = url.searchParams.get('overwrite') === '1';
          // Early reject (avoid reading a 25MB body for an obvious collision); the
          // exclusive write flag below is what actually closes the check-then-write race.
          if (existsSync(loc.abs) && !overwrite) return json(res, 409, { error: 'exists', name: file });
          readRaw(req, MAX_UPLOAD)
            .then((buf) => {
              const ext = path.extname(file).slice(1).toLowerCase();
              if (!contentMatchesExt(ext, buf)) {
                return json(res, 415, { error: `File content does not match a .${ext} image` });
              }
              mkdirSync(loc.dir, { recursive: true });
              try {
                // 'wx' fails if the path already exists → the collision check and the
                // write are atomic, so two concurrent same-name uploads can't clobber.
                writeFileSync(loc.abs, buf, overwrite ? undefined : { flag: 'wx' });
              } catch (err) {
                if ((err as NodeJS.ErrnoException)?.code === 'EEXIST') return json(res, 409, { error: 'exists', name: file });
                throw err;
              }
              changed(design);
              json(res, 200, { ok: true, asset: assetInfo(loc.dir, file) });
            })
            .catch((err) => json(res, err?.message === 'too-large' ? 413 : 500, { error: String(err?.message ?? err) }));
          return;
        }

        if (method === 'DELETE') {
          if (!existsSync(loc.abs)) return json(res, 404, { error: 'not found' });
          try {
            unlinkSync(loc.abs);
            changed(design);
            return json(res, 200, { ok: true });
          } catch (err) {
            return json(res, 500, { error: String((err as Error)?.message ?? err) });
          }
        }

        // PATCH rename
        readJson(req)
          .then((body) => {
            const to = String(body?.to ?? '');
            const dest = resolveItem(design, to);
            if (!dest) return json(res, 400, { error: 'invalid target name' });
            if (!existsSync(loc.abs)) return json(res, 404, { error: 'not found' });
            if (existsSync(dest.abs)) return json(res, 409, { error: 'exists', name: to });
            // A rename that changes the extension must still match the bytes, so a
            // .png can't be relabeled .svg to slip past the upload content sniff.
            const fromExt = path.extname(file).slice(1).toLowerCase();
            const toExt = path.extname(to).slice(1).toLowerCase();
            if (fromExt !== toExt && !contentMatchesExt(toExt, readFileSync(loc.abs))) {
              return json(res, 415, { error: `File content does not match a .${toExt} image` });
            }
            renameSync(loc.abs, dest.abs);
            changed(design);
            json(res, 200, { ok: true, asset: assetInfo(dest.dir, to) });
          })
          .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
      });
    },
  };
}
