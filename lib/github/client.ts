import { ApiOptions, resolveToken } from './token.js';
import {
  AuthenticatedUser,
  CreateRepoOptions,
  CreateRepoResult,
  RepoExistsOptions,
  RepoExistsResult,
  createRepo,
  getAuthenticatedUser,
  repoExists,
} from './api.js';
import { addRemote, push } from './remote.js';

export type GithubClient = {
  resolveToken(explicit?: string): Promise<string>;
  getAuthenticatedUser(auth: ApiOptions): Promise<AuthenticatedUser>;
  repoExists(
    auth: ApiOptions,
    opts: RepoExistsOptions,
  ): Promise<RepoExistsResult>;
  createRepo(
    auth: ApiOptions,
    opts: CreateRepoOptions,
  ): Promise<CreateRepoResult>;
  addRemote(cwd: string, name: string, url: string): Promise<void>;
  push(
    cwd: string,
    auth: ApiOptions,
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
    repoExists,
    createRepo,
    addRemote,
    push,
  };
}

export default defaultGithubClient;
