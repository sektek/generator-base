import {
  commitAll,
  initRepo,
  isDestinationEmpty,
  isRepoInitialized,
} from './git.js';

export type GitClient = {
  isRepoInitialized(cwd: string): Promise<boolean>;
  isDestinationEmpty(cwd: string): Promise<boolean>;
  initRepo(cwd: string): Promise<void>;
  commitAll(cwd: string, message: string): Promise<void>;
};

/**
 * Builds the default `GitClient`, backed by the local `git` binary.
 *
 * @returns A `GitClient` wired to the plain local git helpers in `./git.js`.
 */
export function defaultGitClient(): GitClient {
  return {
    isRepoInitialized,
    isDestinationEmpty,
    initRepo,
    commitAll,
  };
}
