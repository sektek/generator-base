import { commitAll, ensureRepoInitialized } from './git.js';

export type GitClient = {
  ensureRepoInitialized(cwd: string): Promise<boolean>;
  commitAll(cwd: string, message: string): Promise<void>;
};

/**
 * Builds the default `GitClient`, backed by the local `git` binary.
 *
 * @returns A `GitClient` wired to the plain local git helpers in `./git.js`.
 */
export function defaultGitClient(): GitClient {
  return {
    ensureRepoInitialized,
    commitAll,
  };
}
