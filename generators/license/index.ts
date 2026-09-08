import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export class LicenseGenerator extends BaseGenerator<
  BaseConfig,
  BaseOptions,
  BaseFeatures
> {
  constructor(
    args: string[],
    options: BaseOptions,
    features: BaseFeatures = {} as BaseFeatures,
  ) {
    super(args, options, {
      ...DEFAULT_FEATURES,
      ...features,
    });
  }

  taskWriting() {
    const { license, author } = this.options;

    // Only 'MIT' scaffolds a file — every other value (including the
    // 'UNLICENSED' default, or nothing set at all) intentionally leaves the
    // destination without a LICENSE file.
    if (license !== 'MIT') return;

    this.fs.copyTpl(
      this.templatePath('MIT.LICENSE.ejs'),
      this.destinationPath('LICENSE'),
      {
        year: new Date().getFullYear(),
        author: author ?? '',
      },
    );
  }
}

export default LicenseGenerator;
