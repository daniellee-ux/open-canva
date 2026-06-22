import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import fg from 'fast-glob';
import type { Plugin } from 'vite';
import { absFromRel, relFromAbs } from './loc-paths';
import type { UndoStack } from './undo-stack';

/** Largest accepted request body — a prop/text edit is tiny; this only stops abuse. */
const MAX_BODY = 1_000_000;
/** A legal JSX attribute name (so an injected `name` can't become arbitrary JSX). */
const PROP_NAME_RE = /^[A-Za-z_$][A-Za-z0-9_$:-]*$/;
/** A legal CSS property / camelCase style key (so a key can't break out of `{{ }}`). */
const STYLE_KEY_RE = /^-?[A-Za-z][A-Za-z0-9-]*$/;

/**
 * Dev-only edit engine for the inspector. Resolves a clicked object to a source
 * location via its injected `data-ox-loc`, then mutates the source by
 * string-splice (no codegen → byte-stable, surgical HMR). Routes:
 *   POST /__ox/comment  — insert a `@canva-comment` marker
 *   POST /__ox/edit     — apply an edit (op: 'prop' | 'text' | 'style')
 *   POST /__ox/undo     — revert the last write
 *   POST /__ox/redo     — re-apply the last undone write
 *
 * `op: 'prop'` is the canva-critical op: it replaces (or inserts) a single
 * JSX attribute value IN PLACE, so dragging an object — which fires `x`/`y`
 * updates continuously — keeps the source byte-stable and idempotent instead of
 * appending a new `style` entry every time (open-doc's style-merge would bloat).
 */

interface AttrInfo {
  /** Offset of the attribute value's first char (the `"` or `{`), or null if valueless. */
  valStart: number | null;
  /** Offset just past the attribute value, or null if valueless. */
  valEnd: number | null;
  /** Offset of the attribute name's first char (for replacing a valueless shorthand). */
  attrStart: number;
  /** Offset just past the whole attribute. */
  attrEnd: number;
}

interface ElInfo {
  line: number;
  column: number;
  elStart: number; // offset of the element's opening '<'
  elEnd: number; // offset just past the element's closing '>'
  nameEnd: number; // offset right after the tag name (where new attrs go)
  openEnd: number; // offset right after the opening tag '>'
  selfClosing: boolean;
  childrenStart: number | null; // null when self-closing
  childrenEnd: number | null;
  styleObjStart: number | null; // offset just inside the style `{{`, or null
  /** Value spans of each existing style key, so a style edit can replace in place. */
  styleProps: Record<string, { valStart: number; valEnd: number }>;
  attrs: Record<string, AttrInfo>;
}

function collectElements(ast: unknown): ElInfo[] {
  const out: ElInfo[] = [];
  const seen = new Set<unknown>();
  const visit = (node: any) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const n of node) visit(n);
      return;
    }
    if (node.type === 'JSXElement' && node.openingElement?.loc) {
      const open = node.openingElement;
      let styleObjStart: number | null = null;
      const styleProps: Record<string, { valStart: number; valEnd: number }> = {};
      const attrs: Record<string, AttrInfo> = {};
      for (const attr of open.attributes ?? []) {
        if (attr.type !== 'JSXAttribute' || !attr.name?.name) continue;
        const name = String(attr.name.name);
        if (
          name === 'style' &&
          attr.value?.type === 'JSXExpressionContainer' &&
          attr.value.expression?.type === 'ObjectExpression'
        ) {
          styleObjStart = attr.value.expression.start + 1; // just after '{'
          for (const prop of attr.value.expression.properties ?? []) {
            if (prop.type !== 'ObjectProperty' || prop.computed || !prop.value) continue;
            const key =
              prop.key?.type === 'Identifier'
                ? prop.key.name
                : prop.key?.type === 'StringLiteral'
                  ? prop.key.value
                  : null;
            if (key != null && typeof prop.value.start === 'number' && typeof prop.value.end === 'number') {
              styleProps[String(key)] = { valStart: prop.value.start, valEnd: prop.value.end };
            }
          }
        }
        attrs[name] = {
          valStart: attr.value ? attr.value.start : null,
          valEnd: attr.value ? attr.value.end : null,
          attrStart: attr.start,
          attrEnd: attr.end,
        };
      }
      out.push({
        line: open.loc.start.line,
        column: open.loc.start.column,
        elStart: node.start,
        elEnd: node.end,
        nameEnd: open.name?.end ?? open.start,
        openEnd: open.end,
        selfClosing: !!open.selfClosing,
        childrenStart: open.selfClosing ? null : open.end,
        childrenEnd: open.selfClosing ? null : (node.closingElement?.start ?? null),
        styleObjStart,
        styleProps,
        attrs,
      });
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
      const v = node[key];
      if (v && typeof v === 'object') visit(v);
    }
  };
  visit((ast as any).program ?? ast);
  return out;
}

function pickTarget(els: ElInfo[], line: number, column: number): ElInfo | null {
  const sameLine = els.filter((e) => e.line === line);
  const pool = sameLine.length ? sameLine : els;
  if (!pool.length) return null;
  let best = pool[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const e of pool) {
    const colDist = Math.min(Math.abs(e.column - column), Math.abs(e.column - (column - 1)));
    const dist = Math.abs(e.line - line) * 1000 + colDist;
    if (dist < bestDist) {
      best = e;
      bestDist = dist;
    }
  }
  return best;
}

/** Render a JS value as a JSX attribute value: numbers as `{n}`, strings as `{"…"}`. */
function attrLiteral(value: unknown): string {
  if (typeof value === 'number') return `{${value}}`;
  if (typeof value === 'boolean') return `{${value}}`;
  return `{${JSON.stringify(String(value))}}`;
}

function styleEntries(props: Record<string, string>): string {
  return Object.entries(props)
    .map(([k, v]) => `${k}: ${JSON.stringify(String(v))}`)
    .join(', ');
}

/** Read a numeric prop literal off an element: `undefined` if absent (= default 0),
 *  `null` if present but not a plain number literal (so group/ungroup can refuse). */
function readNum(code: string, attr: AttrInfo | undefined): number | null | undefined {
  if (!attr) return undefined;
  if (attr.valStart == null || attr.valEnd == null) return null; // valueless shorthand
  const raw = code.slice(attr.valStart, attr.valEnd).trim();
  const m = /^\{\s*(-?\d+(?:\.\d+)?)\s*\}$/.exec(raw) ?? /^"(-?\d+(?:\.\d+)?)"$/.exec(raw);
  return m ? Number(m[1]) : null;
}

/** A splice that sets a numeric attribute on `t` (replace value / replace shorthand / insert). */
function numSplice(t: ElInfo, name: string, val: number): { start: number; end: number; text: string } {
  const literal = `{${val}}`;
  const existing = t.attrs[name];
  if (existing && existing.valStart != null && existing.valEnd != null) {
    return { start: existing.valStart, end: existing.valEnd, text: literal };
  }
  if (existing) return { start: existing.attrStart, end: existing.attrEnd, text: `${name}=${literal}` };
  return { start: t.nameEnd, end: t.nameEnd, text: ` ${name}=${literal}` };
}

/**
 * A splice that guarantees `<Group>` is in scope before we wrap objects in one:
 * no-op if it's already imported as a value, otherwise append `Group` to the
 * existing `@opencanva/core` named import, otherwise prepend a fresh import. The
 * parse-only safety net (`wouldParse`) can't catch a reference to an undefined
 * `Group` — without this, grouping in a design that doesn't already import Group
 * (e.g. the shipped start-here) writes valid JSX that crashes the board on render.
 */
function groupImportSplice(ast: unknown): { start: number; end: number; text: string } | null {
  const body = ((ast as any).program?.body ?? []) as any[];
  for (const node of body) {
    if (node.type !== 'ImportDeclaration' || node.importKind === 'type') continue;
    for (const spec of node.specifiers ?? []) {
      const imported = spec.imported?.name ?? spec.imported?.value;
      if (spec.type === 'ImportSpecifier' && spec.importKind !== 'type' && (imported === 'Group' || spec.local?.name === 'Group')) {
        return null; // already importable as a value
      }
    }
  }
  for (const node of body) {
    if (node.type !== 'ImportDeclaration' || node.importKind === 'type' || node.source?.value !== '@opencanva/core') continue;
    const named = (node.specifiers ?? []).filter((s: any) => s.type === 'ImportSpecifier');
    if (named.length) {
      const last = named[named.length - 1];
      return { start: last.end, end: last.end, text: ', Group' };
    }
  }
  return { start: 0, end: 0, text: `import { Group } from '@opencanva/core';\n` };
}

export function inspectorApiPlugin(opts: { userCwd: string; designsRoot: string; undoStack: UndoStack }): Plugin {
  const { userCwd, designsRoot, undoStack } = opts;
  // The edit history is shared with the design API (board/token writes) so every
  // write lands on one Cmd+Z timeline. See vite/undo-stack.ts.
  const { applyWrite, depths } = undoStack;

  const resolveDesignFile = (rel: unknown): string | null => {
    if (typeof rel !== 'string' || !rel) return null;
    // Resolve against the SAME base loc-tags-plugin tagged from (the designs
    // parent), so the round-trip holds for any designsDir, not just 'designs'.
    const abs = absFromRel(designsRoot, rel);
    if (!abs.startsWith(designsRoot + path.sep)) return null;
    if (!/\.(tsx|jsx)$/.test(abs) || !existsSync(abs)) return null;
    return abs;
  };

  return {
    name: 'opencanva-inspector-api',
    configureServer(server) {
      const readBody = (req: import('node:http').IncomingMessage): Promise<any> =>
        new Promise((resolve, reject) => {
          let raw = '';
          let size = 0;
          req.on('data', (c) => {
            size += c.length;
            if (size > MAX_BODY) {
              reject(new Error('Request body too large'));
              req.destroy();
              return;
            }
            raw += c;
          });
          req.on('end', () => {
            try {
              resolve(raw ? JSON.parse(raw) : {});
            } catch (e) {
              reject(e);
            }
          });
          req.on('error', reject);
        });

      const json = (res: import('node:http').ServerResponse, code: number, body: unknown) => {
        res.statusCode = code;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(body));
      };

      // These endpoints write to the developer's filesystem, so a request must
      // demonstrably come from the OpenCanva app itself — not any page the dev
      // happens to be visiting. Require a same-origin Origin (a cross-site fetch
      // always carries an attacker Origin) and a JSON content-type (which forces a
      // preflight the dev server won't satisfy cross-origin). Defends every write.
      const sameOrigin = (req: import('node:http').IncomingMessage): boolean => {
        const origin = req.headers.origin;
        if (origin) {
          try {
            if (new URL(origin).host !== req.headers.host) return false;
          } catch {
            return false;
          }
        }
        const site = req.headers['sec-fetch-site'];
        if (typeof site === 'string' && site !== 'same-origin' && site !== 'none') return false;
        return true;
      };
      const guard = (
        req: import('node:http').IncomingMessage,
        res: import('node:http').ServerResponse,
      ): boolean => {
        const ct = String(req.headers['content-type'] ?? '');
        if (!sameOrigin(req) || !ct.includes('application/json')) {
          json(res, 403, { error: 'Forbidden: cross-origin or non-JSON request rejected' });
          return false;
        }
        return true;
      };

      const parseFile = (abs: string) =>
        parse(readFileSync(abs, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });

      // Safety net: never persist a write that no longer parses (e.g. a comment
      // whose text contained the `*/` block-comment terminator). Defends every op.
      const wouldParse = (next: string): boolean => {
        try {
          parse(next, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
          return true;
        } catch {
          return false;
        }
      };

      server.middlewares.use('/__ox/comment', (req, res, next) => {
        const method = req.method ?? 'GET';
        if (method !== 'POST' && method !== 'DELETE') return next();
        if (!guard(req, res)) return;
        readBody(req)
          .then((body) => {
            const { rel, line, column, text } = body;
            const abs = resolveDesignFile(rel);
            if (!abs) return json(res, 403, { error: `Not an editable design file: ${rel}` });
            const code = readFileSync(abs, 'utf8');

            if (method === 'DELETE') {
              // Remove the @canva-comment / data-ox-comment marker whose text matches,
              // nearest the given line.
              const re = /\s*\{\s*\/\*\s*@canva-comment:\s*"((?:[^"\\]|\\.)*)"\s*\*\/\s*\}|\s?data-ox-comment="((?:[^"\\]|\\.)*)"/g;
              let best: { start: number; end: number } | null = null;
              let bestD = Infinity;
              let m: RegExpExecArray | null;
              while ((m = re.exec(code))) {
                const raw = m[1] ?? m[2] ?? '';
                let t = raw;
                try {
                  t = JSON.parse(`"${raw}"`);
                } catch {
                  /* keep raw */
                }
                t = t.replace(/\*\\\//g, '*/');
                if (t !== text) continue;
                const ln = code.slice(0, m.index).split('\n').length;
                const d = Math.abs(ln - Number(line));
                if (d < bestD) {
                  bestD = d;
                  best = { start: m.index, end: m.index + m[0].length };
                }
              }
              if (!best) return json(res, 404, { error: 'comment not found' });
              const nextCode = code.slice(0, best.start) + code.slice(best.end);
              if (!wouldParse(nextCode)) return json(res, 422, { error: 'Delete would break the file; not written.' });
              applyWrite(abs, nextCode);
              return json(res, 200, { ok: true, ...depths() });
            }

            const t = pickTarget(collectElements(parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] })), line, column);
            if (!t) return json(res, 422, { error: `No JSX element near ${line}:${column}` });
            // Neutralize the JS block-comment terminator so a comment containing
            // `*/` can't close the injected comment early and corrupt the file.
            const safe = JSON.stringify(String(text).replace(/\*\//g, '*\\/'));
            const nextCode = t.selfClosing
              ? `${code.slice(0, t.nameEnd)} data-ox-comment=${safe}${code.slice(t.nameEnd)}`
              : `${code.slice(0, t.openEnd)}{/* @canva-comment: ${safe} */}${code.slice(t.openEnd)}`;
            if (!wouldParse(nextCode)) return json(res, 422, { error: 'Comment would break the file; not written.' });
            applyWrite(abs, nextCode);
            json(res, 200, { ok: true, rel, line: t.line });
          })
          .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
      });

      server.middlewares.use('/__ox/edit', (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (!guard(req, res)) return;
        readBody(req)
          .then((body) => {
            const { rel, line, column, op, payload } = body;
            const abs = resolveDesignFile(rel);
            if (!abs) return json(res, 403, { error: `Not an editable design file: ${rel}` });
            const code = readFileSync(abs, 'utf8');
            const t = pickTarget(collectElements(parseFile(abs)), line, column);
            if (!t) return json(res, 422, { error: `No JSX element near ${line}:${column}` });

            let nextCode: string;
            if (op === 'prop') {
              // Replace or insert a single attribute value, in place (idempotent).
              const updates: Record<string, unknown> = payload?.props ?? {};
              const keys = Object.keys(updates);
              if (!keys.length) return json(res, 400, { error: 'No props to set' });
              // Reject any non-identifier name so it can't splice arbitrary JSX
              // (e.g. `onLoad={alert(1)} x`) past the parse-only safety net.
              const badName = keys.find((k) => !PROP_NAME_RE.test(k));
              if (badName) return json(res, 400, { error: `Invalid prop name: ${badName}` });
              // Apply right-to-left by source offset so earlier offsets stay valid.
              type Edit = { start: number; end: number; text: string };
              const edits: Edit[] = [];
              for (const name of keys) {
                const literal = attrLiteral(updates[name]);
                const existing = t.attrs[name];
                if (existing && existing.valStart != null && existing.valEnd != null) {
                  // Attribute has a value → replace just the value, in place.
                  edits.push({ start: existing.valStart, end: existing.valEnd, text: literal });
                } else if (existing) {
                  // Valueless shorthand (e.g. `uppercase`) → replace the whole attribute,
                  // not insert a duplicate (duplicates make the op non-idempotent).
                  edits.push({ start: existing.attrStart, end: existing.attrEnd, text: `${name}=${literal}` });
                } else {
                  edits.push({ start: t.nameEnd, end: t.nameEnd, text: ` ${name}=${literal}` });
                }
              }
              edits.sort((a, b) => b.start - a.start || b.end - a.end);
              nextCode = code;
              for (const e of edits) {
                nextCode = nextCode.slice(0, e.start) + e.text + nextCode.slice(e.end);
              }
            } else if (op === 'remove') {
              // Splice out the whole JSX element, plus any trailing blank line.
              let end = t.elEnd;
              while (end < code.length && (code[end] === ' ' || code[end] === '\t')) end++;
              if (code[end] === '\n') end++;
              nextCode = code.slice(0, t.elStart) + code.slice(end);
            } else if (op === 'text') {
              if (t.selfClosing || t.childrenStart == null || t.childrenEnd == null) {
                return json(res, 422, { error: 'Cannot set text on a self-closing element' });
              }
              const text = String(payload?.text ?? '');
              const replacement = /[<>{}]/.test(text) ? `{${JSON.stringify(text)}}` : text;
              nextCode = code.slice(0, t.childrenStart) + replacement + code.slice(t.childrenEnd);
            } else if (op === 'style') {
              const props = (payload?.props ?? {}) as Record<string, string>;
              const styleKeys = Object.keys(props);
              if (!styleKeys.length) return json(res, 400, { error: 'No style props' });
              // Reject keys that aren't legal CSS/identifier tokens so a key can't
              // break out of the `{{ }}` and inject attributes (e.g. a spread call).
              const badKey = styleKeys.find((k) => !STYLE_KEY_RE.test(k));
              if (badKey) return json(res, 400, { error: `Invalid style key: ${badKey}` });
              if (t.styleObjStart != null) {
                // Replace existing keys IN PLACE and insert only the absent ones, so
                // repeating a style edit stays idempotent instead of accumulating
                // duplicate `key: value,` entries (the bloat op:'prop' exists to avoid).
                type Edit = { start: number; end: number; text: string };
                const edits: Edit[] = [];
                const inserts: string[] = [];
                for (const k of styleKeys) {
                  const valText = JSON.stringify(String(props[k]));
                  const ex = t.styleProps[k];
                  if (ex) edits.push({ start: ex.valStart, end: ex.valEnd, text: valText });
                  else inserts.push(`${k}: ${valText}`);
                }
                if (inserts.length) {
                  edits.push({ start: t.styleObjStart, end: t.styleObjStart, text: ` ${inserts.join(', ')},` });
                }
                edits.sort((a, b) => b.start - a.start || b.end - a.end);
                nextCode = code;
                for (const e of edits) {
                  nextCode = nextCode.slice(0, e.start) + e.text + nextCode.slice(e.end);
                }
              } else {
                nextCode =
                  code.slice(0, t.nameEnd) + ` style={{ ${styleEntries(props)} }}` + code.slice(t.nameEnd);
              }
            } else {
              return json(res, 400, { error: `Unknown op: ${op}` });
            }
            if (!wouldParse(nextCode)) return json(res, 422, { error: 'Edit would break the file; not written.' });
            // Coalesce repeated prop/style tweaks to one element; text/remove stay discrete.
            const coalesceKey = op === 'prop' || op === 'style' ? `${op}:${rel}:${t.line}:${t.column}` : undefined;
            applyWrite(abs, nextCode, coalesceKey);
            json(res, 200, { ok: true, rel, line: t.line, op, ...depths() });
          })
          .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
      });

      // Apply many prop/remove edits across one file in a SINGLE write — so a
      // multi-object move, align, distribute, or multi-delete is one undo entry
      // and one HMR reload (not N flickers). Each edit: { rel, line, column, op, payload }.
      server.middlewares.use('/__ox/edit-batch', (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (!guard(req, res)) return;
        readBody(req)
          .then((body) => {
            const edits = Array.isArray(body?.edits) ? body.edits : [];
            if (!edits.length) return json(res, 400, { error: 'No edits' });
            // Group by the RESOLVED absolute path (not the raw `rel` string) so two
            // different spellings of the same file fold into one group — otherwise
            // they'd splice the same on-disk text twice, clobbering each other.
            const byAbs = new Map<string, any[]>();
            for (const e of edits) {
              const abs = resolveDesignFile(e.rel);
              if (!abs) return json(res, 403, { error: `Not an editable design file: ${e.rel}` });
              if (!byAbs.has(abs)) byAbs.set(abs, []);
              byAbs.get(abs)?.push(e);
            }
            // Pass 1: compute + validate every file's next text WITHOUT writing, so a
            // batch spanning two files can't half-apply (file 1 written, file 2 rejected,
            // leaving the source inconsistent). Only if all files pass do we write (pass 2).
            const planned: { abs: string; next: string }[] = [];
            let dropped = 0; // edits collapsed because two nodes mapped to one source element
            for (const [abs, fileEdits] of byAbs) {
              const code = readFileSync(abs, 'utf8');
              const els = collectElements(parseFile(abs));
              const splices: { start: number; end: number; text: string }[] = [];
              // Two selected DOM nodes can map to ONE source element (e.g. siblings
              // from a .map). Splicing the same attr range twice corrupts the file,
              // so the first edit per (element, prop) wins and later dups are dropped.
              const spliced = new Set<string>();
              for (const e of fileEdits) {
                const t = pickTarget(els, e.line, e.column);
                if (!t) return json(res, 422, { error: `No JSX element near ${e.line}:${e.column}` });
                if (e.op === 'prop') {
                  const updates: Record<string, unknown> = e.payload?.props ?? {};
                  const bad = Object.keys(updates).find((k) => !PROP_NAME_RE.test(k));
                  if (bad) return json(res, 400, { error: `Invalid prop name: ${bad}` });
                  for (const name of Object.keys(updates)) {
                    if (spliced.has(`${t.elStart}:${name}`)) { dropped++; continue; }
                    spliced.add(`${t.elStart}:${name}`);
                    const literal = attrLiteral(updates[name]);
                    const existing = t.attrs[name];
                    if (existing && existing.valStart != null && existing.valEnd != null) {
                      splices.push({ start: existing.valStart, end: existing.valEnd, text: literal });
                    } else if (existing) {
                      splices.push({ start: existing.attrStart, end: existing.attrEnd, text: `${name}=${literal}` });
                    } else {
                      splices.push({ start: t.nameEnd, end: t.nameEnd, text: ` ${name}=${literal}` });
                    }
                  }
                } else if (e.op === 'remove') {
                  if (spliced.has(`${t.elStart}:remove`)) { dropped++; continue; }
                  spliced.add(`${t.elStart}:remove`);
                  let end = t.elEnd;
                  while (end < code.length && (code[end] === ' ' || code[end] === '\t')) end++;
                  if (code[end] === '\n') end++;
                  splices.push({ start: t.elStart, end, text: '' });
                } else {
                  return json(res, 400, { error: `Batch supports prop|remove, got: ${e.op}` });
                }
              }
              splices.sort((a, b) => b.start - a.start || b.end - a.end);
              let next = code;
              for (const s of splices) {
                next = next.slice(0, s.start) + s.text + next.slice(s.end);
              }
              if (!wouldParse(next)) return json(res, 422, { error: 'Batch edit would break the file; not written.' });
              planned.push({ abs, next });
            }
            // Pass 2: every file validated — commit them as ONE transaction so a
            // single Cmd+Z reverts the whole batch together, even across files.
            undoStack.applyBatch(planned);
            const written = planned.map((p) => path.relative(userCwd, p.abs));
            json(res, 200, { ok: true, files: written, dropped, ...depths() });
          })
          .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
      });

      // Wrap 2+ adjacent sibling objects in a <Group>, rebasing their x/y to be
      // relative to the group. Refuses non-adjacent selections (an unselected
      // sibling between them) and non-literal x/y (can't rebase an expression).
      server.middlewares.use('/__ox/group', (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (!guard(req, res)) return;
        readBody(req)
          .then((body) => {
            const { rel, targets } = body as { rel: string; targets: { line: number; column: number }[] };
            const abs = resolveDesignFile(rel);
            if (!abs) return json(res, 403, { error: `Not an editable design file: ${rel}` });
            const code = readFileSync(abs, 'utf8');
            const ast = parseFile(abs);
            const els = collectElements(ast);
            const seen = new Set<number>();
            const infos = (targets ?? [])
              .map((t) => pickTarget(els, t.line, t.column))
              .filter((t): t is ElInfo => !!t && !seen.has(t.elStart) && (seen.add(t.elStart), true))
              .sort((a, b) => a.elStart - b.elStart);
            if (infos.length < 2) return json(res, 400, { error: 'Select 2 or more objects to group' });
            // Refuse a selection that mixes an object with its own container —
            // wrapping it would double-rebase the nested child and mangle the tree.
            const nested = infos.some((a) => infos.some((b) => a !== b && a.elStart > b.elStart && a.elEnd < b.elEnd));
            if (nested) return json(res, 422, { error: "Can't group an object together with its own container." });
            // null = present-but-expression (refuse, can't rebase); undefined = absent (default 0).
            const raw = infos.map((t) => ({ x: readNum(code, t.attrs.x), y: readNum(code, t.attrs.y) }));
            if (raw.some((c) => c.x === null || c.y === null)) {
              return json(res, 422, { error: 'Cannot group objects whose x/y is an expression — use literal numbers.' });
            }
            const coords = raw.map((c) => ({ x: c.x ?? 0, y: c.y ?? 0 }));
            const groupX = Math.min(...coords.map((c) => c.x));
            const groupY = Math.min(...coords.map((c) => c.y));
            const firstStart = infos[0].elStart;
            const lastEnd = infos[infos.length - 1].elEnd;
            const isDescendantOfSelected = (e: ElInfo) => infos.some((s) => s !== e && e.elStart > s.elStart && e.elEnd < s.elEnd);
            const intruder = els.find((e) => !infos.includes(e) && e.elStart >= firstStart && e.elEnd <= lastEnd && !isDescendantOfSelected(e));
            if (intruder) return json(res, 422, { error: 'Group only adjacent objects (an unselected object sits between them).' });

            const splices: { start: number; end: number; text: string }[] = [];
            infos.forEach((t, i) => {
              splices.push(numSplice(t, 'x', coords[i].x - groupX));
              splices.push(numSplice(t, 'y', coords[i].y - groupY));
            });
            splices.push({ start: firstStart, end: firstStart, text: `<Group x={${groupX}} y={${groupY}}>\n        ` });
            splices.push({ start: lastEnd, end: lastEnd, text: `\n      </Group>` });
            // Ensure `Group` is imported (it's near the top, so it applies last under
            // the right-to-left splice order and can't shift the body offsets above).
            const imp = groupImportSplice(ast);
            if (imp) splices.push(imp);
            splices.sort((a, b) => b.start - a.start || b.end - a.end);
            let nextCode = code;
            for (const s of splices) nextCode = nextCode.slice(0, s.start) + s.text + nextCode.slice(s.end);
            if (!wouldParse(nextCode)) return json(res, 422, { error: 'Group would break the file; not written.' });
            applyWrite(abs, nextCode);
            json(res, 200, { ok: true, rel, line: infos[0].line });
          })
          .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
      });

      // Dissolve a <Group>: rebase each direct child's x/y to absolute and remove
      // the wrapper. The inverse of /__ox/group.
      server.middlewares.use('/__ox/ungroup', (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (!guard(req, res)) return;
        readBody(req)
          .then((body) => {
            const { rel, line, column } = body as { rel: string; line: number; column: number };
            const abs = resolveDesignFile(rel);
            if (!abs) return json(res, 403, { error: `Not an editable design file: ${rel}` });
            const code = readFileSync(abs, 'utf8');
            const els = collectElements(parseFile(abs));
            const group = pickTarget(els, line, column);
            if (!group || group.childrenStart == null || group.childrenEnd == null) {
              return json(res, 422, { error: 'Selected object is not an un-groupable container.' });
            }
            const gxRaw = readNum(code, group.attrs.x);
            const gyRaw = readNum(code, group.attrs.y);
            if (gxRaw === null || gyRaw === null) return json(res, 422, { error: 'Group x/y is an expression — cannot ungroup.' });
            const gx = gxRaw ?? 0;
            const gy = gyRaw ?? 0;
            const inner = els.filter((e) => e !== group && e.elStart >= (group.childrenStart as number) && e.elEnd <= (group.childrenEnd as number));
            const children = inner.filter((e) => !inner.some((o) => o !== e && e.elStart > o.elStart && e.elEnd < o.elEnd));
            const splices: { start: number; end: number; text: string }[] = [];
            for (const c of children) {
              const cx = readNum(code, c.attrs.x);
              const cy = readNum(code, c.attrs.y);
              // Leave non-literal child coords untouched (can't rebase an expression).
              if (cx === null || cy === null) continue;
              splices.push(numSplice(c, 'x', (cx ?? 0) + gx));
              splices.push(numSplice(c, 'y', (cy ?? 0) + gy));
            }
            // Remove the opening `<Group ...>` and the closing `</Group>`.
            splices.push({ start: group.childrenEnd as number, end: group.elEnd, text: '' });
            splices.push({ start: group.elStart, end: group.openEnd, text: '' });
            splices.sort((a, b) => b.start - a.start || b.end - a.end);
            let nextCode = code;
            for (const s of splices) nextCode = nextCode.slice(0, s.start) + s.text + nextCode.slice(s.end);
            if (!wouldParse(nextCode)) return json(res, 422, { error: 'Ungroup would break the file; not written.' });
            applyWrite(abs, nextCode);
            json(res, 200, { ok: true, rel, line: group.line });
          })
          .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
      });

      server.middlewares.use('/__ox/undo', (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (!guard(req, res)) return;
        const r = undoStack.undo();
        if (!r) return json(res, 200, { ok: false, empty: true, ...depths() });
        json(res, 200, { ok: true, file: r.files.map((f) => path.relative(userCwd, f)).join(', '), ...depths() });
      });

      server.middlewares.use('/__ox/redo', (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (!guard(req, res)) return;
        const r = undoStack.redo();
        if (!r) return json(res, 200, { ok: false, empty: true, ...depths() });
        json(res, 200, { ok: true, file: r.files.map((f) => path.relative(userCwd, f)).join(', '), ...depths() });
      });

      // Lists pending @canva-comment / data-ox-comment markers in a design, so the
      // inspector can draw a badge on each commented object (comments live in source,
      // not the DOM, so the client can't discover them on its own).
      server.middlewares.use('/__ox/comments', (req, res, next) => {
        if (req.method !== 'GET') return next();
        const url = new URL(req.url ?? '', 'http://localhost');
        const design = url.searchParams.get('design') ?? '';
        res.setHeader('content-type', 'application/json');
        if (!/^[A-Za-z0-9][\w-]*$/.test(design)) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'invalid design id' }));
        }
        const dir = path.join(designsRoot, design);
        const out: { rel: string; line: number; text: string }[] = [];
        try {
          const files = fg.sync('**/*.{tsx,jsx}', { cwd: dir, absolute: true });
          const re = /\{\s*\/\*\s*@canva-comment:\s*"((?:[^"\\]|\\.)*)"\s*\*\/\s*\}|data-ox-comment="((?:[^"\\]|\\.)*)"/g;
          for (const abs of files) {
            const code = readFileSync(abs, 'utf8');
            const rel = relFromAbs(designsRoot, abs);
            let m: RegExpExecArray | null;
            re.lastIndex = 0;
            while ((m = re.exec(code))) {
              const raw = m[1] ?? m[2] ?? '';
              let text = raw;
              try {
                text = JSON.parse(`"${raw}"`);
              } catch {
                /* keep raw */
              }
              text = text.replace(/\*\\\//g, '*/');
              const line = code.slice(0, m.index).split('\n').length;
              out.push({ rel, line, text });
            }
          }
        } catch {
          /* best-effort */
        }
        res.end(JSON.stringify({ comments: out }));
      });
    },
  };
}
