import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const templates = ['gitattributes', 'gitignore'];

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export class GitConfigGenerator extends BaseGenerator<
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
    templates.forEach(template => {
      this.fs.copyTpl(
        this.templatePath(`${template}.ejs`),
        this.destinationPath(`.${template}`),
      );
    });
  }
}

export default GitConfigGenerator;
