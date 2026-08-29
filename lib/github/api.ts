import { NullLogger } from '@sektek/utility-belt';
import { Octokit } from '@octokit/rest';

import { ApiOptions } from './token.js';

/**
 * Builds an Octokit client authenticated per `auth`, with request logging
 * silenced via a {@link NullLogger}. `@octokit/plugin-request-log` (bundled
 * into `@octokit/rest`) writes straight to the console on every non-2xx
 * response by default — noisy and redundant here, since every call site
 * below already catches the failure and rethrows it as a clean Error via
 * toRequestError.
 *
 * @param auth - How to authenticate.
 * @returns The client.
 */
function client(auth: ApiOptions): Octokit {
  return new Octokit({ auth: auth.token, log: new NullLogger() });
}

export type AuthenticatedUser = {
  login: string;
};

export type CreateRepoOptions = {
  owner?: string;
  name: string;
  private: boolean;
  description?: string;
};

export type CreateRepoResult = {
  cloneUrl: string;
  sshUrl: string;
  htmlUrl: string;
};

export type RepoExistsOptions = {
  owner?: string;
  name: string;
};

export type RepoExistsResult = {
  exists: boolean;
  // The owner actually checked against — `opts.owner` when given, or the
  // authenticated user's own login when it wasn't. Callers that omitted
  // `owner` don't otherwise know whose account got checked; this lets an
  // error message name the real account instead of saying "your account".
  owner: string;
};

/**
 * Builds an `Error` from a failed Octokit request, in this module's own
 * message format — kept independent of however Octokit itself words a
 * given failure, so callers (and their error-message assertions) aren't
 * coupled to Octokit's internal formatting.
 *
 * @param error - Whatever Octokit's request threw.
 * @returns An `Error` naming the status and GitHub's own message, when
 *   `error` looks like an Octokit `RequestError`; `error` itself (wrapped in
 *   an `Error` if it isn't already one) otherwise.
 */
function toRequestError(error: unknown): Error {
  if (error instanceof Error && 'status' in error) {
    return new Error(
      `GitHub API request failed with status ${(error as { status: unknown }).status}: ${error.message}`,
    );
  }

  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Fetches the authenticated user.
 *
 * @param auth - How to authenticate.
 * @returns The authenticated user.
 */
export async function getAuthenticatedUser(
  auth: ApiOptions,
): Promise<AuthenticatedUser> {
  try {
    const { data } = await client(auth).users.getAuthenticated();
    return { login: data.login };
  } catch (error) {
    throw toRequestError(error);
  }
}

/**
 * Checks whether `opts.name` already exists under `opts.owner` (or under
 * the authenticated user's own account when `opts.owner` is omitted) —
 * meant to be called *before* scaffolding/committing anything, so a
 * name collision fails fast instead of surfacing only once `createRepo`
 * itself 422s much later, after local work has already happened.
 *
 * @param auth - How to authenticate.
 * @param opts - The repo to check for.
 * @returns Whether it exists, and the owner actually checked.
 */
export async function repoExists(
  auth: ApiOptions,
  opts: RepoExistsOptions,
): Promise<RepoExistsResult> {
  const octokit = client(auth);
  const owner =
    opts.owner ?? (await octokit.users.getAuthenticated()).data.login;

  try {
    await octokit.repos.get({ owner, repo: opts.name });
    return { exists: true, owner };
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) {
      return { exists: false, owner };
    }

    throw toRequestError(error);
  }
}

/**
 * Creates a repository owned by `opts.owner`, or by the authenticated user
 * when `opts.owner` is omitted.
 *
 * @param auth - How to authenticate.
 * @param opts - The repository to create.
 * @returns The created repository's clone/ssh/html urls.
 */
export async function createRepo(
  auth: ApiOptions,
  opts: CreateRepoOptions,
): Promise<CreateRepoResult> {
  const octokit = client(auth);
  const params = {
    name: opts.name,
    private: opts.private,
    description: opts.description,
    auto_init: false,
  };

  try {
    const { data } = opts.owner
      ? await octokit.repos.createInOrg({ org: opts.owner, ...params })
      : await octokit.repos.createForAuthenticatedUser(params);

    // Octokit's types mark clone_url/ssh_url nullable, but GitHub always
    // returns them for a repo it just created — failing loudly here beats
    // silently handing a caller an empty-string url that only breaks much
    // later, in a git command, with no indication why.
    if (!data.clone_url || !data.ssh_url) {
      throw new Error(
        `GitHub created repo '${opts.name}' but its response was missing clone_url/ssh_url`,
      );
    }

    return {
      cloneUrl: data.clone_url,
      sshUrl: data.ssh_url,
      htmlUrl: data.html_url,
    };
  } catch (error) {
    throw toRequestError(error);
  }
}
