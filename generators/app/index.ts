import '../devcontainer/index.js';
import '../editorconfig/index.js';
import '../gitconfig/index.js';
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

  async taskInitializing(_generator: unknown, options: BaseOptions) {
    await this.composeWith('editorconfig', options, true);
    await this.composeWith('gitconfig', options, true);
    await this.composeWith('readme', options, true);
    await this.composeWith('devcontainer', options, true);
  }
}

export default AppGenerator;
