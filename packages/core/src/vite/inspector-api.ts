import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import fg from 'fast-glob';
import type { Plugin } from 'vite';
import { absFromRel, relFromAbs } from './loc-paths';

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

export function inspectorApiPlugin(opts: { userCwd: string; designsRoot: string }): Plugin {
  const { userCwd, designsRoot } = opts;
  const undoStack: { file: string; before: string }[] = [];
  const redoStack: { file: string; before: string }[] = [];

  const resolveDesignFile = (rel: unknown): string | null => {
    if (typeof rel !== 'string' || !rel) return null;
    // Resolve against the SAME base loc-tags-plugin tagged from (the designs
    // parent), so the round-trip holds for any designsDir, not just 'designs'.
    const abs = absFromRel(designsRoot, rel);
    if (!abs.startsWith(designsRoot + path.sep)) return null;
    if (!/\.(tsx|jsx)$/.test(abs) || !existsSync(abs)) return null;
    return abs;
  };

  const applyWrite = (abs: string, next: string) => {
    const before = readFileSync(abs, 'utf8');
    undoStack.push({ file: abs, before });
    redoStack.length = 0;
    writeFileSync(abs, next, 'utf8');
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
        if (req.method !== 'POST') return next();
        if (!guard(req, res)) return;
        readBody(req)
          .then((body) => {
            const { rel, line, column, text } = body;
            const abs = resolveDesignFile(rel);
            if (!abs) return json(res, 403, { error: `Not an editable design file: ${rel}` });
            const code = readFileSync(abs, 'utf8');
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
            applyWrite(abs, nextCode);
            json(res, 200, { ok: true, rel, line: t.line, op });
          })
          .catch((err) => json(res, 500, { error: String(err?.message ?? err) }));
      });

      server.middlewares.use('/__ox/undo', (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (!guard(req, res)) return;
        const entry = undoStack.pop();
        if (!entry) return json(res, 200, { ok: false, empty: true });
        const current = readFileSync(entry.file, 'utf8');
        redoStack.push({ file: entry.file, before: current });
        writeFileSync(entry.file, entry.before, 'utf8');
        json(res, 200, { ok: true, file: path.relative(userCwd, entry.file) });
      });

      server.middlewares.use('/__ox/redo', (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (!guard(req, res)) return;
        const entry = redoStack.pop();
        if (!entry) return json(res, 200, { ok: false, empty: true });
        const current = readFileSync(entry.file, 'utf8');
        undoStack.push({ file: entry.file, before: current });
        writeFileSync(entry.file, entry.before, 'utf8');
        json(res, 200, { ok: true, file: path.relative(userCwd, entry.file) });
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
