import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export class ReadmeGenerator extends BaseGenerator<
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
    this.fs.copyTpl(
      this.templatePath('README.md.ejs'),
      this.destinationPath('README.md'),
      {
        projectName: this.appname,
        projectDescription: this.description,
      },
    );
  }
}

export default ReadmeGenerator;
