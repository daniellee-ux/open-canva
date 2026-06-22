import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyBundledSkills } from './run';

/** Pre-existing entries that don't make a target "non-empty" for scaffolding — a
 *  fresh `git init` / `gh repo create` directory (license, readme, editor config)
 *  is a legitimate place to scaffold into. */
const SCAFFOLD_OK_ENTRIES = new Set([
  '.git',
  '.gitignore',
  '.gitattributes',
  '.DS_Store',
  '.vscode',
  '.idea',
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'README',
  'README.md',
]);

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
  const blockers = existsSync(target) ? readdirSync(target).filter((n) => !SCAFFOLD_OK_ENTRIES.has(n)) : [];
  if (blockers.length) {
    if (existsSync(path.join(target, 'opencanva.config.ts'))) {
      console.error(`${target} already looks like an OpenCanva project. To refresh the bundled skills, run \`npm run sync\` there.`);
    } else {
      console.error(`Target directory is not empty (${blockers.join(', ')}): ${target}\nPass an empty or new directory: opencanva init <dir>`);
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

  // CLAUDE.md is a byte-identical COPY of AGENTS.md, not a symlink — a committed
  // symlink degrades to a 9-byte "AGENTS.md" text file when the user's project is
  // later cloned on a no-symlink/Windows checkout, leaving Claude Code with no
  // guidance. A copy resolves to the real guidance on every platform. (Done before
  // the skills copy so a skills failure still leaves a complete project.)
  rmSync(path.join(target, 'CLAUDE.md'), { force: true });
  cpSync(path.join(target, 'AGENTS.md'), path.join(target, 'CLAUDE.md'));

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
  console.log('  • AGENTS.md (+ CLAUDE.md copy)');
  console.log(`  • ${names.length} skills → .agents/skills/ + .claude/skills/`);
  console.log('  • designs/start-here/');
  console.log('\nNext:');
  if (!inPlace) console.log(`  cd ${where}`);
  // 0.0.x is the unpublished/local-build version: npm install can't resolve the
  // pinned dep from the registry, so surface the link step inline before it fails.
  if (corePkg.version.startsWith('0.0.')) {
    console.log(`  npm link @opencanva/core   # @${corePkg.version} isn't on the registry yet — link a local checkout`);
  }
  console.log('  npm install');
  console.log('  npm run dev      # → http://localhost:5173');
}
