import { Octokit } from '@octokit/rest';

// @octokit/plugin-request-log (bundled into @octokit/rest) writes straight
// to the console on every non-2xx response by default — noisy and
// redundant here, since every call site below already catches the failure
// and rethrows it as a clean Error via toRequestError. No-op every level
// rather than filtering, so a caller's own error handling is the only
// thing that surfaces a failure.
const silentLog = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Builds an Octokit client authenticated as `token`, with request logging
 * silenced (see {@link silentLog}).
 *
 * @param token - The bearer token to authenticate with.
 * @returns The client.
 */
function client(token: string): Octokit {
  return new Octokit({ auth: token, log: silentLog });
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
 * Fetches the user authenticated by `token`.
 *
 * @param token - The bearer token to authenticate with.
 * @returns The authenticated user.
 */
export async function getAuthenticatedUser(
  token: string,
): Promise<AuthenticatedUser> {
  try {
    const { data } = await client(token).users.getAuthenticated();
    return { login: data.login };
  } catch (error) {
    throw toRequestError(error);
  }
}

/**
 * Creates a repository owned by `opts.owner`, or by the authenticated user
 * when `opts.owner` is omitted.
 *
 * @param token - The bearer token to authenticate with.
 * @param opts - The repository to create.
 * @returns The created repository's clone/ssh/html urls.
 */
export async function createRepo(
  token: string,
  opts: CreateRepoOptions,
): Promise<CreateRepoResult> {
  const octokit = client(token);
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

    return {
      cloneUrl: data.clone_url ?? '',
      sshUrl: data.ssh_url ?? '',
      htmlUrl: data.html_url,
    };
  } catch (error) {
    throw toRequestError(error);
  }
}
