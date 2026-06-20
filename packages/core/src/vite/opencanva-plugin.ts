import { existsSync } from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { normalizePath, type Plugin, type ViteDevServer } from 'vite';
import type { OpencanvaConfig } from '../config';
import { DEFAULT_ARTBOARD } from '../sdk';

/**
 * Discovery + virtual modules — the canvas analog of open-slide's plugin. Globs
 * `designs/<id>/index.tsx` into `virtual:opencanva/designs` (a `designIds` list +
 * a `loadDesign(id)` dynamic-import switch), exposes resolved config via
 * `virtual:opencanva/config`, and refreshes on design add/remove/edit.
 */

const DESIGNS_VMOD = 'virtual:opencanva/designs';
const CONFIG_VMOD = 'virtual:opencanva/config';

export interface OpencanvaPluginOptions {
  userCwd: string;
  config: OpencanvaConfig;
  version: string;
}

function resolved(id: string): string {
  return `\0${id}`;
}

async function findDesigns(designsRoot: string): Promise<string[]> {
  if (!existsSync(designsRoot)) return [];
  const hits = await fg('*/index.{tsx,jsx,ts,js}', {
    cwd: designsRoot,
    absolute: true,
    onlyFiles: true,
  });
  return hits.sort();
}

function toId(absFile: string, designsRoot: string): string {
  return path.relative(designsRoot, absFile).split(path.sep)[0];
}

function genDesignsModule(files: string[], designsRoot: string, isDev: boolean): string {
  const entries = files.map((abs) => ({ id: toId(abs, designsRoot), abs }));
  const ids = JSON.stringify(entries.map((e) => e.id).sort());
  const cases = entries
    .map((e) => {
      const fsPath = `/@fs${normalizePath(e.abs)}`;
      const imp = isDev
        ? `import(/* @vite-ignore */ ${JSON.stringify(fsPath)} + ${JSON.stringify('?t=')} + __t)`
        : `import(${JSON.stringify(e.abs)})`;
      return `    case ${JSON.stringify(e.id)}: return ${imp};`;
    })
    .join('\n');
  const devToken = isDev
    ? `let __t = 0;
if (import.meta.hot) {
  import.meta.hot.on('opencanva:design-changed', () => { __t = Date.now(); });
}`
    : 'const __t = 0;';
  return `// virtual:opencanva/designs — generated
export const designIds = ${ids};
${devToken}
export async function loadDesign(id) {
  switch (id) {
${cases}
    default: throw new Error('Design not found: ' + id);
  }
}
`;
}

export function opencanvaPlugin(opts: OpencanvaPluginOptions): Plugin {
  const { userCwd, config, version } = opts;
  const designsDir = config.designsDir ?? 'designs';
  const designsRoot = path.resolve(userCwd, designsDir);
  let isDev = false;

  const isDesignFile = (p: string): boolean => {
    const rel = path.relative(designsRoot, p);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
    return /\.(tsx|jsx|ts|js)$/.test(rel) && rel.includes(path.sep);
  };

  const invalidateDesigns = (server: ViteDevServer) => {
    const mod = server.moduleGraph.getModuleById(resolved(DESIGNS_VMOD));
    if (mod) server.moduleGraph.invalidateModule(mod);
  };

  return {
    name: 'opencanva',
    config(_c, env) {
      isDev = env.command === 'serve';
      return { server: { fs: { allow: [userCwd] } } };
    },
    resolveId(id) {
      if (id === DESIGNS_VMOD) return resolved(DESIGNS_VMOD);
      if (id === CONFIG_VMOD) return resolved(CONFIG_VMOD);
      return null;
    },
    async load(id) {
      if (id === resolved(DESIGNS_VMOD)) {
        const files = await findDesigns(designsRoot);
        return genDesignsModule(files, designsRoot, isDev);
      }
      if (id === resolved(CONFIG_VMOD)) {
        const build = config.build ?? {};
        const resolvedConfig = {
          designsDir,
          artboard: config.artboard ?? DEFAULT_ARTBOARD,
          build: {
            showDesignBrowser: build.showDesignBrowser ?? true,
            showDesignUi: build.showDesignUi ?? true,
            allowPngDownload: build.allowPngDownload ?? true,
            allowSvgDownload: build.allowSvgDownload ?? true,
            allowPdfDownload: build.allowPdfDownload ?? true,
          },
          version,
        };
        return `export default ${JSON.stringify(resolvedConfig)};\n`;
      }
      return null;
    },
    handleHotUpdate(ctx) {
      // Edits to a design file: refresh content WITHOUT a full reload (which would
      // drop UI state like the inspector selection / current zoom & pan). Bump the
      // import token via a custom event and re-import; suppress Vite's default HMR
      // by returning []. (trap #3)
      if (ctx.file.startsWith(designsRoot + path.sep)) {
        ctx.server.ws.send({ type: 'custom', event: 'opencanva:design-changed', data: {} });
        return [];
      }
      return undefined;
    },
    configureServer(server) {
      if (existsSync(designsRoot)) server.watcher.add(designsRoot);

      let reloadTimer: ReturnType<typeof setTimeout> | null = null;
      const reload = () => {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          reloadTimer = null;
          invalidateDesigns(server);
          server.ws.send({ type: 'full-reload' });
        }, 120);
      };

      // Adding/removing a design changes the design list → full reload is appropriate.
      server.watcher.on('add', (p) => {
        if (isDesignFile(p)) reload();
      });
      server.watcher.on('unlink', (p) => {
        if (isDesignFile(p)) reload();
      });
    },
  };
}
