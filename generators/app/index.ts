import { Composite, Prompt } from '@sektek/generator';

import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';
import { ConfigGenerator } from '../config/index.js';
import { DevcontainerGenerator } from '../devcontainer/index.js';
import { EditorConfigGenerator } from '../editorconfig/index.js';
import { GitConfigGenerator } from '../gitconfig/index.js';
import { GitGenerator } from '../git/index.js';
import { LicenseGenerator } from '../license/index.js';
import { ReadmeGenerator } from '../readme/index.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

// satisfies, not a `: Composite[]` annotation, so each entry's
// generatorClass keeps its specific type (and with it, the static
// prompts()/composites() every CoreGenerator subclass inherits) instead of
// widening to Composite's own generatorClass field type, which — same as
// Constructor<T> generally — carries no static members.
//
// github isn't listed here: it's composited into git instead (see
// git/index.ts), since creating a GitHub repo is really a sub-decision of
// setting up git in the first place, not an independent top-level concern.
const COMPOSITES = [
  { name: 'editorconfig', generatorClass: EditorConfigGenerator },
  { name: 'git', generatorClass: GitGenerator },
  { name: 'gitconfig', generatorClass: GitConfigGenerator },
  { name: 'license', generatorClass: LicenseGenerator },
  { name: 'readme', generatorClass: ReadmeGenerator },
  { name: 'devcontainer', generatorClass: DevcontainerGenerator },
  { name: 'config', generatorClass: ConfigGenerator },
] satisfies Composite[];

export class AppGenerator extends BaseGenerator<
  BaseConfig,
  BaseOptions,
  BaseFeatures
> {
  static composites(): Composite[] {
    return COMPOSITES;
  }

  static prompts(): Prompt[] {
    return COMPOSITES.flatMap(({ generatorClass }) => generatorClass.prompts());
  }

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
    // defaults, but broke as soon as git/github needed a real one.
    // this.options is the actual, correct source, matching every other
    // generator in this codebase.
    const { options } = this;
    for (const { name } of AppGenerator.composites()) {
      await this.composeWith(name, options, true);
    }
  }
}

export default AppGenerator;
