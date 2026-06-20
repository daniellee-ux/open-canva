import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { normalizePath, type Plugin } from 'vite';

/**
 * Assets API — lists files under `designs/<id>/assets/` so the in-app assets
 * panel can show what a design has to work with (logos, photos, textures).
 * Read-only: authors add files in their editor; this surfaces and previews them.
 */
export function assetsPlugin(opts: { designsRoot: string }): Plugin {
  const { designsRoot } = opts;
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif']);
  return {
    name: 'opencanva-assets',
    configureServer(server) {
      server.middlewares.use('/__ox/assets', (req, res, next) => {
        if (req.method !== 'GET') return next();
        const url = new URL(req.url ?? '', 'http://localhost');
        const design = url.searchParams.get('design') ?? '';
        res.setHeader('content-type', 'application/json');
        if (!/^[A-Za-z0-9][\w-]*$/.test(design)) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'invalid design id' }));
        }
        const dir = path.join(designsRoot, design, 'assets');
        const files = existsSync(dir)
          ? readdirSync(dir)
              .filter((f) => !f.startsWith('.'))
              .map((name) => {
                const abs = path.join(dir, name);
                const ext = path.extname(name).slice(1).toLowerCase();
                return {
                  name,
                  ext,
                  size: statSync(abs).size,
                  isImage: imageExts.has(ext),
                  url: `/@fs${normalizePath(abs)}`,
                };
              })
          : [];
        res.end(JSON.stringify({ design, dir: `designs/${design}/assets`, files }));
      });
    },
  };
}
