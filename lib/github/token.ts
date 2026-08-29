import childProcess from 'node:child_process';
import { promisify } from 'node:util';

const MISSING_TOKEN_MESSAGE =
  'Unable to resolve a GitHub token. Set the GITHUB_TOKEN or GH_TOKEN ' +
  'environment variable, run `gh auth login`, or pass an explicit token.';

/**
 * Resolves a GitHub token, trying each of the following in order and using
 * the first one that resolves to a value:
 *
 * 1. The `explicit` argument.
 * 2. The `GITHUB_TOKEN` environment variable.
 * 3. The `GH_TOKEN` environment variable.
 * 4. `gh auth token`, shelled out to the `gh` CLI.
 *
 * Throws if none of the above resolve to a token.
 *
 * @param explicit - A token to use, taking precedence over every other source.
 * @returns The resolved token.
 */
export async function resolveToken(explicit?: string): Promise<string> {
  if (explicit) {
    return explicit;
  }

  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  if (process.env.GH_TOKEN) {
    return process.env.GH_TOKEN;
  }

  const ghToken = await resolveTokenFromGhCli();
  if (ghToken) {
    return ghToken;
  }

  throw new Error(MISSING_TOKEN_MESSAGE);
}

/**
 * Reads a token from `gh auth token`, returning `undefined` if `gh` isn't
 * installed, the user isn't logged in, or it printed nothing.
 *
 * @returns The resolved token, or `undefined`.
 */
async function resolveTokenFromGhCli(): Promise<string | undefined> {
  try {
    const execFileAsync = promisify(childProcess.execFile);
    const { stdout } = await execFileAsync('gh', ['auth', 'token']);
    const token = stdout.trim();
    return token || undefined;
  } catch {
    // `gh` may not be installed or the user may not be logged in - either
    // way, fall through and let the caller try the next option.
    return undefined;
  }
}
