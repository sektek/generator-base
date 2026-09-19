import childProcess from 'node:child_process';
import { promisify } from 'node:util';

import {
  ChainedOptionalProvider,
  EnvVarOptionalProvider,
} from '@sektek/utility-belt';

/**
 * How every call in `lib/github` authenticates against the GitHub API and
 * `git push`. A dedicated type rather than a bare `token: string` parameter
 * so that a future auth mechanism (e.g. a slow migration off tokens) only
 * needs new optional fields here, not a signature change at every call
 * site that currently takes a token.
 */
export type ApiOptions = {
  token: string;
};

const MISSING_TOKEN_MESSAGE =
  'Unable to resolve a GitHub token. Set the GITHUB_TOKEN or GH_TOKEN ' +
  'environment variable, run `gh auth login`, or pass an explicit token.';

/**
 * The non-`explicit` half of {@link resolveToken}'s chain, shared with
 * {@link deriveGithubToken}: `GITHUB_TOKEN` env, then `GH_TOKEN` env, then
 * `gh auth token`.
 */
const envChain = new ChainedOptionalProvider<string>({
  providers: [
    new EnvVarOptionalProvider({ variableName: 'GITHUB_TOKEN' }),
    new EnvVarOptionalProvider({ variableName: 'GH_TOKEN' }),
    resolveTokenFromGhCli,
  ],
});

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
  const token = explicit || (await envChain.get());
  if (!token) {
    throw new Error(MISSING_TOKEN_MESSAGE);
  }
  return token;
}

/**
 * A `githubToken` prompt's provider: the same chain as `resolveToken`
 * (minus the `explicit` argument, meaningless for a prompt's own default),
 * but resolving to `undefined` instead of throwing when nothing's found,
 * so the user can just type one in.
 *
 * @returns The resolved token, or `undefined`.
 */
export async function deriveGithubToken(): Promise<string | undefined> {
  return envChain.get();
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
