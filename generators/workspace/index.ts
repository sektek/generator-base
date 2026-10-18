import {
  Composite,
  DestinationMode,
  Prompt,
  projectNamePrompt,
} from '@sektek/generator';

import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';
import { ConfigGenerator } from '../config/index.js';
import { DevcontainerGenerator } from '../devcontainer/index.js';
import { EditorConfigGenerator } from '../editorconfig/index.js';
import { GitConfigGenerator } from '../gitconfig/index.js';
import { ReadmeGenerator } from '../readme/index.js';

const VSCODE_TEMPLATES = {
  'settings.json.ejs': '.vscode/settings.json',
  'launch.json.ejs': '.vscode/launch.json',
};

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

const COMPOSITES = [
  { name: 'editorconfig', generatorClass: EditorConfigGenerator },
  { name: 'gitconfig', generatorClass: GitConfigGenerator },
  { name: 'readme', generatorClass: ReadmeGenerator },
  { name: 'devcontainer', generatorClass: DevcontainerGenerator },
  { name: 'config', generatorClass: ConfigGenerator },
] satisfies Composite[];

export class WorkspaceGenerator extends BaseGenerator<
  BaseConfig,
  BaseOptions,
  BaseFeatures
> {
  static composites(): Composite[] {
    return COMPOSITES;
  }

  static destinationMode(): DestinationMode {
    return { kind: 'newProjectDir' };
  }

  static prompts(): Prompt[] {
    return [projectNamePrompt, ...super.prompts()];
  }

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

  // Composed here rather than in taskInitializing: beforeQueue runs before
  // this generator's own task queue is built, so readme writes README.md
  // before our own taskWriting appends the checklist to it.
  async beforeQueue() {
    for (const { name } of WorkspaceGenerator.composites()) {
      await this.composeWith(
        name,
        name === 'devcontainer'
          ? { ...this.options, profile: 'workspace' }
          : this.options,
        true,
      );
    }
  }

  taskWriting() {
    const data = { projectName: this.appname };

    Object.entries(VSCODE_TEMPLATES).forEach(([template, destination]) => {
      this.fs.copyTpl(
        this.templatePath(template),
        this.destinationPath(destination),
        data,
      );
    });

    this.fs.appendTpl(
      this.destinationPath('README.md'),
      this.fs.read(this.templatePath('README-checklist.md.ejs')) ?? '',
      {},
    );
  }
}

export default WorkspaceGenerator;
