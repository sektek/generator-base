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
 * Checks whether `cwd` already has a git repository — a pure predicate,
 * with no side effect. Split out from a single `ensureRepoInitialized`
 * helper so the `is`-prefix is honest about doing nothing but checking;
 * callers that need to actually create one call {@link initRepo}
 * themselves.
 *
 * @param cwd - The directory to check.
 * @returns Whether `cwd/.git` already exists.
 */
export async function isRepoInitialized(cwd: string): Promise<boolean> {
  return fs.existsSync(join(cwd, '.git'));
}

/**
 * Checks whether `cwd` has no entries at all (or doesn't exist yet) — a
 * pure predicate, no side effect. Used to decide whether it's safe to
 * auto-commit *everything* in the directory (`commitAll`'s `git add -A`):
 * a non-empty, not-yet-git directory might hold files unrelated to this
 * run (pending work, secrets, etc.) that shouldn't be swept into an
 * "Initial commit" without being asked.
 *
 * @param cwd - The directory to check.
 * @returns Whether `cwd` currently has zero entries, or doesn't exist.
 */
export async function isDestinationEmpty(cwd: string): Promise<boolean> {
  if (!fs.existsSync(cwd)) {
    return true;
  }

  return fs.readdirSync(cwd).length === 0;
}

/**
 * Initializes a git repository in `cwd` with `git init -b main`.
 *
 * @param cwd - The directory to initialize a git repository in.
 */
export async function initRepo(cwd: string): Promise<void> {
  await run(cwd, ['init', '-b', 'main']);
}

/**
 * Stages every change in `cwd` and commits it with `message`.
 *
 * No "skip if nothing staged" logic: this is only ever called right after
 * a fresh {@link initRepo}, against a repo that's guaranteed to have
 * untracked scaffolded files to commit.
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
