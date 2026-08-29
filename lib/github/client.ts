import {
  AuthenticatedUser,
  CreateRepoOptions,
  CreateRepoResult,
  createRepo,
  getAuthenticatedUser,
} from './api.js';
import { addRemote, push } from './remote.js';
import { resolveToken } from './token.js';

export type GithubClient = {
  resolveToken(explicit?: string): Promise<string>;
  getAuthenticatedUser(token: string): Promise<AuthenticatedUser>;
  createRepo(token: string, opts: CreateRepoOptions): Promise<CreateRepoResult>;
  addRemote(cwd: string, name: string, url: string): Promise<void>;
  push(
    cwd: string,
    token: string,
    remote: string,
    branch: string,
  ): Promise<void>;
};

/**
 * Builds a {@link GithubClient} backed by the real GitHub API and the local
 * `git`/`gh` binaries.
 *
 * @returns The client.
 */
export function defaultGithubClient(): GithubClient {
  return {
    resolveToken,
    getAuthenticatedUser,
    createRepo,
    addRemote,
    push,
  };
}

export default defaultGithubClient;
