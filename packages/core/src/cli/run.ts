import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as viteBuild, createServer, preview as vitePreview } from 'vite';
import { createViteConfig } from '../vite/config';

export async function dev(): Promise<void> {
  const config = await createViteConfig({ userCwd: process.cwd(), command: 'serve' });
  const server = await createServer(config);
  await server.listen();
  server.printUrls();
}

export async function build(): Promise<void> {
  const config = await createViteConfig({ userCwd: process.cwd(), command: 'build' });
  await viteBuild(config);
}

export async function preview(): Promise<void> {
  const config = await createViteConfig({ userCwd: process.cwd(), command: 'build' });
  const server = await vitePreview(config);
  server.printUrls();
}

/** The agent skill directories `sync`/`init` populate. `.agents/skills/` is the
 *  vendor-neutral location read by Codex, Cursor, and others (committed); the
 *  Claude-specific `.claude/skills/` is git-ignored and regenerated locally. */
export const SKILL_DIRS = ['.agents/skills', '.claude/skills'] as const;

/** Copy the bundled agent skills into `root`'s `.agents/skills/` and
 *  `.claude/skills/`. Returns the skill names copied. */
export function copyBundledSkills(root: string): string[] {
  const skillsSrc = fileURLToPath(new URL('../../skills', import.meta.url));
  if (!existsSync(skillsSrc)) throw new Error('No skills bundled with @opencanva/core.');
  const names = readdirSync(skillsSrc).filter((n) => !n.startsWith('.'));
  for (const rel of SKILL_DIRS) {
    const dest = path.join(root, ...rel.split('/'));
    mkdirSync(dest, { recursive: true });
    for (const name of names) {
      // Replace each bundled skill in full (so a file removed upstream doesn't
      // linger), but NEVER touch other entries — a user may keep their own skills
      // in this dir. (A bundled skill that's renamed/removed upstream leaves its
      // old dir behind; for the committed demo copy, `check:sync` flags it so a
      // maintainer can remove it — we don't auto-delete unknown dirs.)
      rmSync(path.join(dest, name), { recursive: true, force: true });
      cpSync(path.join(skillsSrc, name), path.join(dest, name), { recursive: true });
    }
  }
  return names;
}

/** True if `cwd` is anywhere inside THIS framework's monorepo (some ancestor
 *  package.json is named "opencanva"). */
function insideFrameworkRepo(cwd: string): boolean {
  for (let d = cwd; ; ) {
    const pkg = path.join(d, 'package.json');
    if (existsSync(pkg)) {
      try {
        if ((JSON.parse(readFileSync(pkg, 'utf8')) as { name?: string }).name === 'opencanva') return true;
      } catch {
        /* ignore an unreadable package.json */
      }
    }
    const parent = path.dirname(d);
    if (parent === d) return false;
    d = parent;
  }
}

/** Copy the bundled agent skills into the workspace's skill dirs (both agent
 *  conventions), so the authoring knowledge is available to every agent. */
export async function sync(): Promise<void> {
  // Guard the footgun: bare `opencanva sync` anywhere inside THIS framework's repo
  // (root, packages/core, …) would write a stray skills tree there. Refuse unless
  // the cwd is an actual workspace (has opencanva.config.ts, e.g. apps/demo). User
  // projects aren't inside the framework repo, so this never trips them.
  if (insideFrameworkRepo(process.cwd()) && !existsSync(path.join(process.cwd(), 'opencanva.config.ts'))) {
    console.error('Refusing to sync here inside the OpenCanva monorepo — run `npm run sync` (it targets apps/demo).');
    process.exitCode = 1;
    return;
  }
  try {
    const names = copyBundledSkills(process.cwd());
    console.log(`Synced ${names.length} skills → ${SKILL_DIRS.join(' + ')}/ (${names.join(', ')})`);
  } catch (err) {
    console.error(String((err as Error)?.message ?? err));
    process.exitCode = 1; // a real copy failure must be observable to callers / CI
  }
}
