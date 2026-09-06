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

  /**
   * SPDX license identifier for the generated project. Only `'MIT'` is
   * currently recognized as scaffolding a `LICENSE` file (naming `author`
   * as the copyright holder) — every other value, including the default
   * `'UNLICENSED'`, scaffolds no file at all.
   */
  license?: string;

  /**
   * Copyright holder named in the `LICENSE` file when `license` is
   * `'MIT'`. Defaults to `undefined` (an empty copyright line).
   */
  author?: string;

  /**
   * The full path (absolute, or relative to the destination root) to write
   * this run's `gen.config.*` file to. Its extension selects the format
   * (`.js`/`.yaml`/`.yml`/`.json`). Defaults to `gen.config.yaml` directly
   * under the destination root when omitted.
   */
  configFile?: string;

  /**
   * The subset of this run's option keys that were explicitly supplied by
   * the caller this run (a real CLI flag, or an interactive wizard answer)
   * rather than a schema default silently filled in. Populated by
   * `tools/gen`'s CLI (its own `flagsGiven`) before the generator run
   * starts — the `config` sub-generator uses it to decide which values to
   * actually populate in `gen.config.*` versus leave as a commented-out
   * placeholder. Left undefined by a caller outside that CLI (e.g. a
   * generator run directly via `@sektek/generator-test`'s helper); `config`
   * then falls back to treating every key present on `this.options` as
   * explicit.
   */
  explicitOptionKeys?: string[];
};
