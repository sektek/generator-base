import '../git/index.js';

import { GithubClient, defaultGithubClient } from '../../lib/github/client.js';
import { ApiOptions } from '../../lib/github/token.js';
import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export type GithubGeneratorOptions = BaseOptions & {
  /**
   * Test-only dependency-injection escape hatch for supplying a fake
   * `GithubClient`. Never exposed via `tools/gen`'s schema.
   */
  githubClient?: GithubClient;
};

export class GithubGenerator extends BaseGenerator<
  BaseConfig,
  GithubGeneratorOptions,
  BaseFeatures
> {
  constructor(
    args: string[],
    options: GithubGeneratorOptions,
    features: BaseFeatures = {} as BaseFeatures,
  ) {
    super(args, options, {
      ...DEFAULT_FEATURES,
      ...features,
    });
  }

  async taskInitializing() {
    await this.composeWith('git', this.options, true);
  }

  async taskEnd() {
    const { options } = this;
    if (!options.createRepo) return;

    const client = options.githubClient ?? defaultGithubClient();
    const cwd = this.destinationRoot();
    const token = await client.resolveToken(options.githubToken);
    const auth: ApiOptions = { token };
    const visibility = options.repoVisibility ?? 'private';

    const repo = await client.createRepo(auth, {
      owner: options.repoOwner,
      name: this.projectSlug,
      private: visibility === 'private',
      description: options.description,
    });

    await client.addRemote(cwd, 'origin', repo.cloneUrl);

    if (options.push !== false) {
      await client.push(cwd, auth, 'origin', 'main');
      this.log(`Pushed to ${repo.htmlUrl}`);
    }
  }
}

export default GithubGenerator;
