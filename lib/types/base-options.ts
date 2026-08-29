import { CoreOptions } from '@sektek/generator';

export type BaseOptions = CoreOptions & {
  /**
   * Whether to initialize a git repository (and commit the scaffolded
   * files) after every other composed generator has run. Defaults to
   * `true` — opt out with `--no-git-init`.
   */
  gitInit?: boolean;

  /**
   * Whether to create a GitHub repository and push the scaffolded project
   * to it. Defaults to `false` — opt in with `--create-repo`.
   */
  createRepo?: boolean;

  /**
   * The created repository's visibility. Defaults to `'private'`.
   */
  repoVisibility?: 'public' | 'private';

  /**
   * The owner (user or org) to create the repository under. Defaults to
   * `undefined`, which creates the repository under the authenticated
   * user's own account.
   */
  repoOwner?: string;

  /**
   * An explicit GitHub token to authenticate with. Defaults to `undefined`,
   * which falls back to `lib/github/token.ts`'s own resolution chain
   * (`GITHUB_TOKEN`/`GH_TOKEN` env vars, then `gh auth token`).
   */
  githubToken?: string;

  /**
   * Whether to push to the newly-created remote after adding it. Defaults
   * to `true` — set to `false` to stop after the remote is added, without
   * pushing.
   */
  push?: boolean;
};
