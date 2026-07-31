#!/usr/bin/env node
// Blocks until a just-published version actually resolves on the registry.
// create-opencanva pins @opencanva/core with a caret range, so publishing the
// wrapper before core is resolvable would tag a `latest` that fails to install
// (ETARGET) for anyone running `npm create opencanva@latest` in that window.
//
// Usage: node scripts/wait-for-registry.mjs <@scope/name> [attempts]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIRS = { '@opencanva/core': 'packages/core', 'create-opencanva': 'packages/create-opencanva' };

const name = process.argv[2];
const attempts = Number(process.argv[3] ?? 20);
const dir = DIRS[name];
if (!dir) {
  console.error(`Unknown package "${name}". Known: ${Object.keys(DIRS).join(', ')}`);
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(path.join(ROOT, dir, 'package.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (let i = 1; i <= attempts; i++) {
  try {
    // --prefer-online: skip npm's metadata cache, which would happily keep
    // serving the pre-publish document for the whole loop.
    const live = execFileSync('npm', ['view', `${name}@${version}`, 'version', '--prefer-online'], {
      encoding: 'utf8',
      // A pre-publish E404 is the normal case here — keep npm's error dump out
      // of the log so the polling lines stay readable.
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (live === version) {
      console.log(`✓ ${name}@${version} is live on the registry (attempt ${i}).`);
      process.exit(0);
    }
  } catch {
    // not there yet
  }
  console.log(`… waiting for ${name}@${version} (attempt ${i}/${attempts})`);
  await sleep(5000);
}

console.error(`✗ ${name}@${version} never appeared on the registry — not publishing anything that depends on it.`);
process.exit(1);
