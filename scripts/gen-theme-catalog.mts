#!/usr/bin/env tsx
// Regenerates the theme catalog table in packages/core/skills/create-design/SKILL.md
// from `designPresets` in packages/core/src/design.ts — the single source of truth
// for preset vibe/tags metadata. Run via tsx (design.ts is TypeScript).
//
//   npm run gen:catalog            rewrite the table in place (then `npm run sync`)
//   npm run check:sync             includes --check: fails if the table is stale
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { designPresets } from '../packages/core/src/design.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKILL = path.join(ROOT, 'packages/core/skills/create-design/SKILL.md');
const BEGIN = '<!-- theme-catalog:start -->';
const END = '<!-- theme-catalog:end -->';

/** First quoted family in a font stack, else the first segment. */
const fontName = (stack: string) => stack.match(/'([^']+)'/)?.[1] ?? stack.split(',')[0].trim();

const rows = Object.entries(designPresets).map(([name, d]) => {
  const missing = [!d.vibe && 'vibe', !d.tags?.length && 'tags'].filter(Boolean);
  if (missing.length) {
    console.error(`✗ preset '${name}' is missing ${missing.join(' + ')} — every designPresets entry needs both.`);
    process.exit(1);
  }
  return `| \`${name}\` | ${d.vibe} | ${d.tags!.join(', ')} | ${fontName(d.fonts.display)} |`;
});

const table = [
  `_Generated from \`designPresets\` by \`npm run gen:catalog\` — do not edit by hand._`,
  '',
  '| Theme | Vibe | Tags | Display font |',
  '| --- | --- | --- | --- |',
  ...rows,
].join('\n');

const src = readFileSync(SKILL, 'utf8');
const start = src.indexOf(BEGIN);
const end = src.indexOf(END);
if (start === -1 || end === -1 || end < start) {
  console.error(`✗ ${path.relative(ROOT, SKILL)}: missing ${BEGIN} / ${END} markers.`);
  process.exit(1);
}
const next = src.slice(0, start + BEGIN.length) + '\n\n' + table + '\n\n' + src.slice(end);

if (process.argv.includes('--check')) {
  if (next !== src) {
    console.error('✗ theme catalog is stale — run `npm run gen:catalog && npm run sync` and commit.');
    process.exit(1);
  }
  console.log('✓ theme catalog matches designPresets');
} else if (next === src) {
  console.log('theme catalog already up to date');
} else {
  writeFileSync(SKILL, next);
  console.log(`wrote ${path.relative(ROOT, SKILL)} (${rows.length} presets) — now run \`npm run sync\``);
}
