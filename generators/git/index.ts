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

  async taskEnd() {
    const { options } = this;
    if (options.gitInit === false) return;

    const client = options.gitClient ?? defaultGitClient();
    const cwd = this.destinationRoot();
    const alreadyInitialized = await client.isRepoInitialized(cwd);
    if (!alreadyInitialized) {
      await client.initRepo(cwd);
      await client.commitAll(cwd, 'Initial commit');
    }
  }
}

export default GitGenerator;
