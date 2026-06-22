import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyBundledSkills } from './run';

/**
 * Scaffold a fresh OpenCanva project: config + starter design + both agent skill
 * dirs + an `AGENTS.md` (with `CLAUDE.md` symlinked to it), so a new project is
 * multi-agent ready out of the box.
 */
export async function init(targetArg?: string): Promise<void> {
  const templateSrc = fileURLToPath(new URL('../../template', import.meta.url));
  if (!existsSync(templateSrc)) {
    console.error('Project template not found in @opencanva/core.');
    process.exit(1);
  }

  const target = path.resolve(process.cwd(), targetArg ?? '.');
  if (existsSync(target) && readdirSync(target).some((n) => !n.startsWith('.'))) {
    console.error(`Target directory is not empty: ${target}\nPass an empty or new directory: opencanva init <dir>`);
    process.exit(1);
  }
  mkdirSync(target, { recursive: true });

  // Copy the template tree (package.json, config, tsconfig, AGENTS.md, designs/).
  for (const entry of readdirSync(templateSrc)) {
    cpSync(path.join(templateSrc, entry), path.join(target, entry), { recursive: true });
  }
  // npm strips a packaged `.gitignore`, so the template ships it as `gitignore`.
  const gi = path.join(target, 'gitignore');
  if (existsSync(gi)) renameSync(gi, path.join(target, '.gitignore'));

  // Install the bundled skills into both agent conventions.
  const names = copyBundledSkills(target);

  // CLAUDE.md → AGENTS.md so every agent's conventional entry point resolves to
  // one source (fall back to a copy on filesystems without symlink support).
  try {
    symlinkSync('AGENTS.md', path.join(target, 'CLAUDE.md'));
  } catch {
    cpSync(path.join(target, 'AGENTS.md'), path.join(target, 'CLAUDE.md'));
  }

  const rel = path.relative(process.cwd(), target) || '.';
  console.log(`\nScaffolded an OpenCanva project in ${rel}/`);
  console.log('  • AGENTS.md + CLAUDE.md (symlink)');
  console.log(`  • ${names.length} skills → .agents/skills/ + .claude/skills/`);
  console.log('  • designs/start-here/');
  console.log('\nNext:');
  if (rel !== '.') console.log(`  cd ${rel}`);
  console.log('  npm install');
  console.log('  npm run dev      # → http://localhost:5173');
}
