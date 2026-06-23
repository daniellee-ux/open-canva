#!/usr/bin/env node
// Thin wrapper so `npm create opencanva@latest [dir]` works: it locates the
// @opencanva/core CLI (a dependency) and runs `opencanva init [dir]`, forwarding
// any args. All scaffolding logic lives in @opencanva/core's `init`.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
// '.' resolves to <core>/src/index.ts → the package root is two levels up.
const coreBin = path.join(require.resolve('@opencanva/core'), '..', '..', 'bin', 'opencanva.mjs');

const result = spawnSync(process.execPath, [coreBin, 'init', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 1);
