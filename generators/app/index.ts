import '../devcontainer/index.js';
import '../editorconfig/index.js';
import '../git/index.js';
import '../gitconfig/index.js';
import '../github/index.js';
import '../readme/index.js';

import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export class AppGenerator extends BaseGenerator<
  BaseConfig,
  BaseOptions,
  BaseFeatures
> {
  constructor(
    args: string[],
    options: BaseOptions,
    features: BaseFeatures = {} as BaseFeatures,
  ) {
    super(args, options, { ...DEFAULT_FEATURES, ...features });
  }

  async taskInitializing() {
    // Not (_generator, options) positional params: yeoman-generator invokes
    // a queued task with this.args (the generator's raw positional CLI
    // args, always [] here) as its call arguments, never with this
    // generator's actual resolved options. The previous (_generator,
    // options) signature silently received `options: undefined` on every
    // real run, so none of the composed sub-generators below ever actually
    // saw a caller-supplied option (gitInit, createRepo, etc.) — latent and
    // harmless while every composed sub-generator only read CoreOptions
    // defaults, but broke as soon as git/github needed a real one. this
    // .options is the actual, correct source, matching every other
    // generator in this codebase.
    const { options } = this;
    await this.composeWith('editorconfig', options, true);
    await this.composeWith('git', options, true);
    await this.composeWith('gitconfig', options, true);
    await this.composeWith('github', options, true);
    await this.composeWith('readme', options, true);
    await this.composeWith('devcontainer', options, true);
  }
}

export default AppGenerator;
