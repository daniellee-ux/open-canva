import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyBundledSkills } from './run';

/** Pre-existing entries that don't make a target "non-empty" for scaffolding —
 *  a fresh `git init` directory is a legitimate place to scaffold into. */
const SCAFFOLD_OK_ENTRIES = new Set(['.git', '.gitignore', '.DS_Store']);

/**
 * Scaffold a fresh OpenCanva project: config + starter design + both agent skill
 * dirs + an `AGENTS.md` (with `CLAUDE.md` symlinked to it), so a new project is
 * multi-agent ready out of the box.
 */
export async function init(targetArg?: string): Promise<void> {
  if (targetArg?.startsWith('-')) {
    console.error('Usage: opencanva init [directory]');
    process.exit(1);
  }
  const templateSrc = fileURLToPath(new URL('../../template', import.meta.url));
  if (!existsSync(templateSrc)) {
    console.error('Project template not found in @opencanva/core.');
    process.exit(1);
  }

  const target = path.resolve(process.cwd(), targetArg ?? '.');
  if (existsSync(target) && !statSync(target).isDirectory()) {
    console.error(`Target is not a directory: ${target}`);
    process.exit(1);
  }
  // Refuse to scaffold over real content (any entry except a fresh-repo allowlist —
  // including dotfiles like .env, so we don't silently clobber a configured dir).
  if (existsSync(target) && readdirSync(target).some((n) => !SCAFFOLD_OK_ENTRIES.has(n))) {
    if (existsSync(path.join(target, 'opencanva.config.ts'))) {
      console.error(`${target} already looks like an OpenCanva project. To refresh the bundled skills, run \`npm run sync\` there.`);
    } else {
      console.error(`Target directory is not empty: ${target}\nPass an empty or new directory: opencanva init <dir>`);
    }
    process.exit(1);
  }
  mkdirSync(target, { recursive: true });

  // Copy the template tree (package.json, config, tsconfig, AGENTS.md, designs/).
  for (const entry of readdirSync(templateSrc)) {
    cpSync(path.join(templateSrc, entry), path.join(target, entry), { recursive: true });
  }
  // npm strips a packaged `.gitignore`, so the template ships it as `gitignore`.
  const gi = path.join(target, 'gitignore');
  const dotGi = path.join(target, '.gitignore');
  if (existsSync(gi)) {
    if (existsSync(dotGi)) {
      // Keep the user's existing .gitignore but append any template rules it lacks
      // (notably `.claude/`, so the regenerated Claude skills aren't committed).
      const existing = readFileSync(dotGi, 'utf8');
      const norm = (l: string) => l.replace(/\/+$/, ''); // treat `.claude` and `.claude/` as one rule
      const have = new Set(existing.split('\n').map((l) => norm(l.trim())));
      const add = readFileSync(gi, 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#') && !have.has(norm(l)));
      if (add.length) writeFileSync(dotGi, `${existing.replace(/\n*$/, '')}\n\n# Added by opencanva init\n${add.join('\n')}\n`);
      rmSync(gi);
    } else {
      renameSync(gi, dotGi);
    }
  }

  // Pin @opencanva/core to the EXACT version of the CLI doing the scaffold, so the
  // dependency always matches the version that produced the project (a caret on a
  // 0.0.x version resolves to that exact version anyway).
  const corePkg = JSON.parse(readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8')) as {
    version: string;
  };
  const projPkgPath = path.join(target, 'package.json');
  const projPkg = JSON.parse(readFileSync(projPkgPath, 'utf8')) as { dependencies?: Record<string, string> };
  if (projPkg.dependencies?.['@opencanva/core']) {
    projPkg.dependencies['@opencanva/core'] = corePkg.version;
    writeFileSync(projPkgPath, `${JSON.stringify(projPkg, null, 2)}\n`);
  }

  // CLAUDE.md → AGENTS.md so every agent's conventional entry point resolves to one
  // source. Done BEFORE the skills copy so that if that fails, the recovery hint
  // (`npm run sync`, which only installs skills) still leaves a complete project.
  // Fall back to a plain copy on filesystems without symlink support (e.g. Windows).
  rmSync(path.join(target, 'CLAUDE.md'), { force: true });
  try {
    symlinkSync('AGENTS.md', path.join(target, 'CLAUDE.md'));
  } catch {
    // Mark the copy so it isn't mistaken for a separately-maintained file as AGENTS.md evolves.
    const agents = readFileSync(path.join(target, 'AGENTS.md'), 'utf8');
    writeFileSync(
      path.join(target, 'CLAUDE.md'),
      `<!-- Copy of AGENTS.md (symlinks unsupported here) — AGENTS.md is the source; keep this in sync. -->\n\n${agents}`,
    );
    console.warn('Note: created CLAUDE.md as a copy of AGENTS.md (symlinks unsupported); keep them in sync.');
  }

  // Install the bundled skills last, so a copy failure leaves an otherwise-complete
  // project that the printed `npm run sync` can finish.
  let names: string[];
  try {
    names = copyBundledSkills(target);
  } catch (err) {
    console.error(`Project files were created, but installing skills failed: ${String((err as Error)?.message ?? err)}`);
    console.error(`Run \`npm run sync\` in ${target} to finish.`);
    process.exit(1);
  }

  // Show what the user typed (or the absolute path), not a `../..`-relative path.
  const where = targetArg && targetArg !== '.' ? targetArg : target;
  const inPlace = !targetArg || targetArg === '.';
  console.log(`\nScaffolded an OpenCanva project in ${where}`);
  console.log('  • AGENTS.md + CLAUDE.md (symlink)');
  console.log(`  • ${names.length} skills → .agents/skills/ + .claude/skills/`);
  console.log('  • designs/start-here/');
  console.log('\nNext:');
  if (!inPlace) console.log(`  cd ${where}`);
  console.log('  npm install');
  console.log('  npm run dev      # → http://localhost:5173');
  console.log(`\n(npm install needs @opencanva/core@${corePkg.version} on the registry; until it's`);
  console.log("published, run `npm link @opencanva/core` from a local checkout.)");
}
