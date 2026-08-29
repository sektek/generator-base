import { GitClient, defaultGitClient } from '../../lib/git/client.js';
import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export type GitGeneratorOptions = BaseOptions & {
  /**
   * Test-only dependency-injection escape hatch for supplying a fake
   * `GitClient`. Never exposed via `tools/gen`'s schema.
   */
  gitClient?: GitClient;
};

export class GitGenerator extends BaseGenerator<
  BaseConfig,
  GitGeneratorOptions,
  BaseFeatures
> {
  // Decided once in taskInitializing, before Yeoman's writing phase adds
  // any files — by taskEnd the destination is never empty regardless of
  // what was there when this run started, so "was it empty" can only be
  // answered this early. See taskInitializing for why this matters.
  #shouldInitAndCommit = false;

  constructor(
    args: string[],
    options: GitGeneratorOptions,
    features: BaseFeatures = {} as BaseFeatures,
  ) {
    super(args, options, {
      ...DEFAULT_FEATURES,
      ...features,
    });
  }

  async taskInitializing() {
    const { options } = this;
    if (options.gitInit === false) return;

    const client = options.gitClient ?? defaultGitClient();
    const cwd = this.destinationRoot();

    // Only safe to auto-commit *everything* (commitAll's `git add -A`)
    // when we're the ones creating the repo AND the destination started
    // empty — otherwise pre-existing, unrelated files (pending work,
    // secrets, whatever else happened to be sitting there) would get
    // swept into the "Initial commit" without anyone asking for that.
    const alreadyInitialized = await client.isRepoInitialized(cwd);
    this.#shouldInitAndCommit =
      !alreadyInitialized && (await client.isDestinationEmpty(cwd));
  }

  async taskEnd() {
    if (!this.#shouldInitAndCommit) return;

    const { options } = this;
    const client = options.gitClient ?? defaultGitClient();
    const cwd = this.destinationRoot();
    await client.initRepo(cwd);
    await client.commitAll(cwd, 'Initial commit');
  }
}

export default GitGenerator;
