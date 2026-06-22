#!/usr/bin/env node
// Validates the init template the way a REAL user experiences it: scaffold into a
// temp dir OUTSIDE the repo, install its OWN declared deps in isolation (with
// @opencanva/core supplied as a packed tarball, since it's unpublished), and
// typecheck. The in-repo `tsc -p template/tsconfig.json` resolves deps from the
// hoisted monorepo node_modules, so it can't catch a dropped/mistyped template
// dependency — this can.
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'oc-template-'));
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });

try {
  const tgz = execSync(`npm pack --silent --pack-destination ${tmp}`, {
    cwd: path.join(ROOT, 'packages/core'),
  })
    .toString()
    .trim();
  const tgzAbs = path.join(tmp, tgz);
  const proj = path.join(tmp, 'project');

  run(`node ${path.join(ROOT, 'packages/core/bin/opencanva.mjs')} init ${proj}`, ROOT);
  // The scaffold pins @opencanva/core to the (unpublished) CLI version; point it at
  // the packed tarball so npm can resolve it, then install the rest from the registry.
  run(`npm pkg set "dependencies.@opencanva/core=file:${tgzAbs}"`, proj);
  run('npm install --no-audit --no-fund', proj);
  run('npm run typecheck', proj);
  console.log('\n✓ scaffolded template installs its declared deps and typechecks in isolation.');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
