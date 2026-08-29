import childProcess from 'node:child_process';
import { promisify } from 'node:util';

import { ApiOptions } from './token.js';

/**
 * Adds a git remote named `name` pointing at `url` in the repository at
 * `cwd`.
 *
 * @param cwd - The local repository's working directory.
 * @param name - The remote's name, e.g. `origin`.
 * @param url - The remote's url.
 */
export async function addRemote(
  cwd: string,
  name: string,
  url: string,
): Promise<void> {
  const execFileAsync = promisify(childProcess.execFile);
  await execFileAsync('git', ['remote', 'add', name, url], { cwd });
}

/**
 * Pushes `branch` to `remote`, authenticating via a per-invocation HTTP
 * header rather than embedding the token in the remote URL or persisting it
 * to `.git/config`.
 *
 * @param cwd - The local repository's working directory.
 * @param auth - How to authenticate the push.
 * @param remote - The remote to push to, e.g. `origin`.
 * @param branch - The branch to push.
 */
export async function push(
  cwd: string,
  auth: ApiOptions,
  remote: string,
  branch: string,
): Promise<void> {
  const execFileAsync = promisify(childProcess.execFile);
  await execFileAsync(
    'git',
    [
      '-c',
      `http.extraHeader=AUTHORIZATION: bearer ${auth.token}`,
      'push',
      '-u',
      remote,
      branch,
    ],
    { cwd },
  );
}
