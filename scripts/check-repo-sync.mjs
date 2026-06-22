#!/usr/bin/env node
// Guards the committed copies that are easy to let drift:
//   1. apps/demo/.agents/skills  must equal  packages/core/skills   (the source of truth)
//   2. packages/core/template/designs/start-here  must equal  apps/demo/designs/start-here
//   3. each skills-lock.json entry's computedHash must match the vendored .agents/skills/<name> tree
// Run by CI; fix mismatches by re-running `npm run sync`, re-copying the template
// starter, or recomputing the lock hash, then committing.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
let failed = false;
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  failed = true;
};
const ok = (msg) => console.log(`✓ ${msg}`);

/** Sorted relative paths of every file under `dir`. */
function listFiles(dir) {
  const out = [];
  const walk = (d, base) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const rel = base ? `${base}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(d, e.name), rel);
      else out.push(rel);
    }
  };
  if (existsSync(dir)) walk(dir, '');
  return out.sort();
}

/** Fail if two directories differ in file set or any file's bytes. */
function expectEqual(a, b, label) {
  if (!existsSync(a) || !existsSync(b)) {
    fail(`${label}: missing directory (${!existsSync(a) ? a : b})`);
    return;
  }
  const fa = listFiles(a);
  const fb = listFiles(b);
  if (fa.join('\n') !== fb.join('\n')) {
    const setA = new Set(fa);
    const setB = new Set(fb);
    const stale = fb.filter((f) => !setA.has(f)); // present in the committed copy, gone from source
    const missing = fa.filter((f) => !setB.has(f)); // in source, not yet copied
    const detail = [stale.length && `stale (remove): ${stale.join(', ')}`, missing.length && `missing (run sync): ${missing.join(', ')}`]
      .filter(Boolean)
      .join('; ');
    fail(`${label}: file lists differ — ${detail}`);
    return;
  }
  for (const f of fa) {
    if (!readFileSync(path.join(a, f)).equals(readFileSync(path.join(b, f)))) {
      fail(`${label}: content differs in ${f}`);
      return;
    }
  }
  ok(`${label}: in sync (${fa.length} files)`);
}

expectEqual(
  path.join(ROOT, 'packages/core/skills'),
  path.join(ROOT, 'apps/demo/.agents/skills'),
  'apps/demo/.agents/skills == packages/core/skills',
);
expectEqual(
  path.join(ROOT, 'apps/demo/designs/start-here'),
  path.join(ROOT, 'packages/core/template/designs/start-here'),
  'template start-here == demo start-here',
);

const lockPath = path.join(ROOT, 'skills-lock.json');
if (existsSync(lockPath)) {
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  for (const [name, entry] of Object.entries(lock.skills ?? {})) {
    const dir = path.join(ROOT, '.agents/skills', name);
    if (!existsSync(dir)) {
      fail(`skills-lock: vendored skill missing: .agents/skills/${name}`);
      continue;
    }
    const h = createHash('sha256');
    for (const f of listFiles(dir)) {
      h.update(f); // fold the path in too, so a rename/shuffle is detected
      h.update('\0');
      h.update(readFileSync(path.join(dir, f)));
    }
    const got = h.digest('hex');
    if (got !== entry.computedHash) {
      fail(`skills-lock: hash mismatch for ${name}\n    lock: ${entry.computedHash}\n    tree: ${got}`);
    } else {
      ok(`skills-lock: ${name} hash matches`);
    }
  }
}

if (failed) {
  console.error('\nRepo sync check FAILED — see above.');
  process.exit(1);
}
console.log('\nAll repo sync checks passed.');
