#!/usr/bin/env node
// Publishes one workspace package unless that exact version is already on the
// registry — so a release run that failed halfway (e.g. the wrapper step) can be
// re-run with workflow_dispatch without tripping over "cannot publish over the
// previously published version".
//
// Auth comes from GitHub Actions OIDC (trusted publishing): no NPM_TOKEN, no OTP.
//
// Usage: node scripts/publish-if-needed.mjs <@scope/name | name>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIRS = { '@opencanva/core': 'packages/core', 'create-opencanva': 'packages/create-opencanva' };

const name = process.argv[2];
const dir = DIRS[name];
if (!dir) {
  console.error(`Unknown package "${name}". Known: ${Object.keys(DIRS).join(', ')}`);
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(path.join(ROOT, dir, 'package.json'), 'utf8'));

let live = null;
try {
  live = execFileSync('npm', ['view', `${name}@${version}`, 'version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  // E404 (nothing published under this version, or the package is brand new) —
  // the expected path on a real release.
}

if (live === version) {
  console.log(`↷ ${name}@${version} is already on the registry — skipping publish.`);
  process.exit(0);
}

console.log(`→ publishing ${name}@${version} …`);
execFileSync('npm', ['publish', '-w', name, '--access', 'public'], { cwd: ROOT, stdio: 'inherit' });
console.log(`✓ published ${name}@${version}`);
