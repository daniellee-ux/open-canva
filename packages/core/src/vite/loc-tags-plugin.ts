import path from 'node:path';
import { parse } from '@babel/parser';
import type { Plugin } from 'vite';
import { relFromAbs } from './loc-paths';

/**
 * Source-location tagging — the reliable backbone of click-to-source. Parses the
 * ORIGINAL source and injects `data-ox-loc="rel:line:col"` onto every JSX opening
 * element authored under designs/. Runs `enforce: 'pre'` so the attribute becomes
 * a normal prop, readable at runtime off the fiber chain — even across component
 * boundaries (a host <div> rendered by <Box> has no tag, but the <Box> fiber's
 * props do).
 *
 * We do NOT use React's `_debugSource`: its line numbers reflect post-transform
 * positions and drift from the on-disk file, so edits land on the wrong element.
 */
export function locTagsPlugin(opts: { designsRoot: string }): Plugin {
  const designsRoot = opts.designsRoot;
  return {
    name: 'opencanva-loc-tags',
    enforce: 'pre',
    transform(code, id) {
      const clean = id.split('?')[0];
      if (!/\.(tsx|jsx)$/.test(clean)) return null;
      const abs = path.resolve(clean);
      if (!abs.startsWith(designsRoot + path.sep)) return null;

      // rel from the designs parent so it round-trips with the write-back API.
      const rel = relFromAbs(designsRoot, abs);
      let ast: ReturnType<typeof parse>;
      try {
        ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
      } catch {
        return null;
      }

      const inserts: { at: number; text: string }[] = [];
      const seen = new Set<unknown>();
      const visit = (node: any) => {
        if (!node || typeof node !== 'object' || seen.has(node)) return;
        seen.add(node);
        if (Array.isArray(node)) {
          for (const n of node) visit(n);
          return;
        }
        if (node.type === 'JSXOpeningElement' && node.name && node.loc) {
          const has = (node.attributes ?? []).some(
            (a: any) => a.type === 'JSXAttribute' && a.name?.name === 'data-ox-loc',
          );
          if (!has) {
            const loc = `${rel}:${node.loc.start.line}:${node.loc.start.column}`;
            inserts.push({ at: node.name.end, text: ` data-ox-loc="${loc}"` });
          }
        }
        for (const key of Object.keys(node)) {
          if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
          const v = node[key];
          if (v && typeof v === 'object') visit(v);
        }
      };
      visit((ast as any).program);
      if (!inserts.length) return null;

      inserts.sort((a, b) => b.at - a.at);
      let out = code;
      for (const ins of inserts) out = out.slice(0, ins.at) + ins.text + out.slice(ins.at);
      return { code: out, map: null };
    },
  };
}
