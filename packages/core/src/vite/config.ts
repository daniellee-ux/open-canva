import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { type InlineConfig, loadConfigFromFile, searchForWorkspaceRoot } from 'vite';
import type { OpencanvaConfig } from '../config';
import { assetsPlugin } from './assets-plugin';
import { currentPlugin } from './current-plugin';
import { inspectorApiPlugin } from './inspector-api';
import { locTagsPlugin } from './loc-tags-plugin';
import { opencanvaPlugin } from './opencanva-plugin';

const VERSION = '0.0.0';

/** Absolute path to the runtime SPA shipped inside this package (src/app). */
export function appRoot(): string {
  return fileURLToPath(new URL('../app', import.meta.url));
}

export async function loadUserConfig(userCwd: string): Promise<OpencanvaConfig> {
  const file = path.join(userCwd, 'opencanva.config.ts');
  if (!existsSync(file)) return {};
  const loaded = await loadConfigFromFile(
    { command: 'serve', mode: 'development' },
    file,
    userCwd,
    'silent',
  );
  return (loaded?.config ?? {}) as OpencanvaConfig;
}

export interface CreateViteConfigOptions {
  userCwd: string;
  command: 'serve' | 'build';
}

export async function createViteConfig(opts: CreateViteConfigOptions): Promise<InlineConfig> {
  const { userCwd, command } = opts;
  const config = await loadUserConfig(userCwd);
  const root = appRoot();
  const designsDir = config.designsDir ?? 'designs';
  const designsRoot = path.resolve(userCwd, designsDir);
  const workspaceRoot = searchForWorkspaceRoot(userCwd);

  return {
    root,
    base: config.base ?? '/',
    configFile: false,
    appType: 'spa',
    plugins: [
      locTagsPlugin({ designsRoot }),
      react(),
      opencanvaPlugin({ userCwd, config, version: VERSION }),
      inspectorApiPlugin({ userCwd, designsRoot }),
      currentPlugin({ userCwd }),
      assetsPlugin({ designsRoot }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: config.port ?? 5173,
      fs: { allow: [workspaceRoot, root, userCwd] },
    },
    build: {
      outDir: path.resolve(userCwd, 'dist'),
      emptyOutDir: true,
    },
    optimizeDeps: {
      // Virtual modules must not be pre-bundled.
      exclude: ['virtual:opencanva/designs', 'virtual:opencanva/config'],
    },
    define: {
      __OPENCANVA_COMMAND__: JSON.stringify(command),
    },
  };
}
