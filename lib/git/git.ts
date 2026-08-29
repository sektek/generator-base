import { createRequire } from 'node:module';
import { join } from 'node:path';
import { promisify } from 'node:util';

// Resolved via `createRequire` rather than a plain `import`: sinon can't
// stub a property on an ES module namespace object (they're non-writable),
// and a `promisify`d function captured from a plain `import` at
// module-load time wouldn't observe a stub installed afterwards either,
// since that capture happens before any test gets a chance to install one.
// `createRequire` instead hands back the same, ordinary (and therefore
// stubbable) object Node's own CommonJS module cache uses for these two
// built-ins — both this module and its spec resolve `execFile`/`existsSync`
// off of it fresh on every access, so a stub sinon installs on either
// object is visible to the other.
const require = createRequire(import.meta.url);
const childProcess =
  require('node:child_process') as typeof import('node:child_process');
const fs = require('node:fs') as typeof import('node:fs');

/**
 * Runs `git <args>` in `cwd`.
 *
 * @param cwd - The directory to run git in.
 * @param args - The git subcommand and its arguments.
 */
async function run(cwd: string, args: string[]): Promise<void> {
  await promisify(childProcess.execFile)('git', args, { cwd });
}

/**
 * Initializes a git repository in `cwd` with `git init -b main`, but only if
 * one doesn't already exist there.
 *
 * @param cwd - The directory to initialize (or check) a git repository in.
 * @returns `true` if a repository was just created, `false` if `cwd/.git`
 * already existed. Callers use this to decide whether it's safe to
 * auto-commit.
 */
export async function ensureRepoInitialized(cwd: string): Promise<boolean> {
  if (fs.existsSync(join(cwd, '.git'))) {
    return false;
  }

  await run(cwd, ['init', '-b', 'main']);
  return true;
}

/**
 * Stages every change in `cwd` and commits it with `message`.
 *
 * No "skip if nothing staged" logic: this is only ever called right after
 * `ensureRepoInitialized` returns `true`, against a repo that was just
 * created and is guaranteed to have untracked scaffolded files to commit.
 *
 * Git identity (`user.name`/`user.email`) is intentionally left to the
 * caller's own git config — a missing identity surfaces git's own native
 * commit error unmodified.
 *
 * @param cwd - The repository to stage and commit changes in.
 * @param message - The commit message.
 */
export async function commitAll(cwd: string, message: string): Promise<void> {
  await run(cwd, ['add', '-A']);
  await run(cwd, ['commit', '-m', message]);
}
