import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const COMMON_TEMPLATES = {
  'Dockerfile.ejs': '.devcontainer/Dockerfile',
};

const WORKSPACE_TEMPLATES = {
  'devcontainer.workspace.json.ejs': '.devcontainer/devcontainer.json',
  'docker-compose.yml.ejs': '.devcontainer/docker-compose.yml',
};

const DEFAULT_TEMPLATES = {
  'devcontainer.default.json.ejs': '.devcontainer/devcontainer.json',
};

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export class DevcontainerGenerator extends BaseGenerator<
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
    const data = { projectName: this.appname };
    const templates =
      this.options.profile === 'workspace'
        ? { ...COMMON_TEMPLATES, ...WORKSPACE_TEMPLATES }
        : { ...COMMON_TEMPLATES, ...DEFAULT_TEMPLATES };

    Object.entries(templates).forEach(([template, destination]) => {
      this.fs.copyTpl(
        this.templatePath(template),
        this.destinationPath(destination),
        data,
      );
    });
  }
}

export default DevcontainerGenerator;
