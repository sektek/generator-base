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
  // Resolved once in taskInitializing (alongside the repo-exists safety
  // check, which needs a token to call the API anyway) and reused in
  // taskEnd, rather than resolving the token a second time there.
  #auth?: ApiOptions;

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
    const { options } = this;

    if (options.createRepo) {
      const client = options.githubClient ?? defaultGithubClient();
      const token = await client.resolveToken(options.githubToken);
      this.#auth = { token };

      // Fail fast, before any scaffolding/git work happens: without this,
      // a name collision only surfaces from createRepo's own 422 in
      // taskEnd, by which point `git` has already inited and committed
      // locally for nothing.
      const { exists, owner } = await client.repoExists(this.#auth, {
        owner: options.repoOwner,
        name: this.projectSlug,
      });
      if (exists) {
        throw new Error(
          `GitHub repo '${owner}/${this.projectSlug}' already exists. ` +
            'Choose a different destination directory, pass --repo-owner ' +
            'to target a different account/org, or delete the existing ' +
            'repo first.',
        );
      }
    }

    await this.composeWith('git', this.options, true);
  }

  async taskEnd() {
    const { options } = this;
    if (!options.createRepo) return;

    const client = options.githubClient ?? defaultGithubClient();
    const cwd = this.destinationRoot();
    // Set in taskInitializing whenever createRepo is true, which is the
    // only way taskEnd reaches this point.
    const auth = this.#auth!;
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
