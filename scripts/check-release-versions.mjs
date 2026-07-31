#!/usr/bin/env node
// Release guard for .github/workflows/release.yml. A publish can't be undone, so
// assert the three things that have historically gone wrong at release time:
//
//   1. the tag says one version and package.json says another,
//   2. create-opencanva's version drifts from core's,
//   3. create-opencanva still pins the PREVIOUS core minor — a caret on ^0.3.0
//      does not cover 0.4.0, so `npm create opencanva@latest` keeps scaffolding
//      the old core (see the publish-order note in AGENTS.md history).
//
// Usage: node scripts/check-release-versions.mjs [vX.Y.Z]   (empty tag = skip 1)
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));

const core = read('packages/core/package.json');
const wrapper = read('packages/create-opencanva/package.json');
const tag = (process.argv[2] ?? '').trim();
const errors = [];

if (tag) {
  const want = tag.replace(/^v/, '');
  if (want !== core.version) errors.push(`tag ${tag} != @opencanva/core@${core.version}`);
  if (want !== wrapper.version) errors.push(`tag ${tag} != create-opencanva@${wrapper.version}`);
}

if (core.version !== wrapper.version) {
  errors.push(`version drift: @opencanva/core@${core.version} vs create-opencanva@${wrapper.version}`);
}

const range = wrapper.dependencies?.['@opencanva/core'];
if (range !== `^${core.version}`) {
  errors.push(
    `create-opencanva depends on @opencanva/core "${range}" — expected "^${core.version}", ` +
      `or fresh projects get the old core`,
  );
}

if (errors.length) {
  console.error(`✗ release version check failed:\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ release versions consistent: ${core.version}${tag ? ` (tag ${tag})` : ''}`);
