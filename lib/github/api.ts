const GITHUB_API_URL = 'https://api.github.com';

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

type GithubUserResponse = {
  login: string;
};

type GithubRepoResponse = {
  clone_url: string;
  ssh_url: string;
  html_url: string;
};

type GithubErrorResponse = {
  message?: string;
};

/**
 * Builds the standard set of GitHub REST API request headers.
 *
 * @param token - The bearer token to authenticate with.
 * @param withContentType - Whether to include a JSON `Content-Type` header,
 *   for requests with a body.
 * @returns The request headers.
 */
function requestHeaders(
  token: string,
  withContentType = false,
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (withContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Builds an `Error` describing a non-2xx GitHub API response.
 *
 * @param response - The failed response.
 * @returns An `Error` naming the status and the response's `message` field.
 */
async function toResponseError(response: Response): Promise<Error> {
  const body = (await response.json().catch(() => undefined)) as
    GithubErrorResponse | undefined;

  return new Error(
    `GitHub API request failed with status ${response.status}: ` +
      `${body?.message ?? response.statusText}`,
  );
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
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers: requestHeaders(token),
  });

  if (!response.ok) {
    throw await toResponseError(response);
  }

  const body = (await response.json()) as GithubUserResponse;
  return { login: body.login };
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
  const path = opts.owner ? `/orgs/${opts.owner}/repos` : '/user/repos';

  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    method: 'POST',
    headers: requestHeaders(token, true),
    body: JSON.stringify({
      name: opts.name,
      private: opts.private,
      description: opts.description,
      auto_init: false,
    }),
  });

  if (!response.ok) {
    throw await toResponseError(response);
  }

  const body = (await response.json()) as GithubRepoResponse;
  return {
    cloneUrl: body.clone_url,
    sshUrl: body.ssh_url,
    htmlUrl: body.html_url,
  };
}
