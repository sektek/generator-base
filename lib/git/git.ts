import childProcess from 'node:child_process';
import fs from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

/**
 * Runs `git <args>` in `cwd`.
 *
 * @param cwd - The directory to run git in.
 * @param args - The git subcommand and its arguments.
 */
async function run(cwd: string, args: string[]): Promise<void> {
  const execFileAsync = promisify(childProcess.execFile);
  await execFileAsync('git', args, { cwd });
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
