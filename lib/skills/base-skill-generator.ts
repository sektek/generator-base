import { join } from 'node:path';

import { DestinationMode, Prompt } from '@sektek/generator';

import { BaseConfig } from '../types/base-config.js';
import { BaseFeatures } from '../types/base-features.js';
import { BaseGenerator } from '../base-generator.js';
import { BaseOptions } from '../types/base-options.js';

import { SkillScope, scopePrompt, skillsDirectory } from './skill-scope.js';

/** An agent skill a skill generator installs. */
export type SkillDefinition = {
  /** The skill's name, and the name of the directory it is installed in. */
  name: string;
  /** One line saying what the skill is for and when an agent should use it. */
  description: string;
  /** The template, under the generator's `templates/`, rendered to `SKILL.md`. */
  template: string;
};

export type SkillOptions = BaseOptions & {
  /** `project` installs into the destination; `user` into the home directory. Defaults to `project`. */
  scope?: SkillScope;
};

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

/**
 * Base class for a generator that installs one agent skill. A subclass
 * declares its `skill`; this class renders the skill's template, given
 * `{ name, description }`, to `<skills directory>/<name>/SKILL.md`.
 */
export abstract class BaseSkillGenerator extends BaseGenerator<
  BaseConfig,
  SkillOptions,
  BaseFeatures
> {
  static prompts(): Prompt[] {
    return [scopePrompt];
  }

  static destinationMode(): DestinationMode {
    return { kind: 'inPlace' };
  }

  abstract readonly skill: SkillDefinition;

  constructor(
    args: string[],
    options: SkillOptions,
    features: BaseFeatures = {} as BaseFeatures,
  ) {
    super(args, options, {
      ...DEFAULT_FEATURES,
      ...features,
    });
  }

  taskWriting() {
    const { name, description, template } = this.skill;
    const root = skillsDirectory(
      'claude',
      this.options.scope ?? 'project',
      this.destinationRoot(),
    );

    this.fs.copyTpl(this.templatePath(template), join(root, name, 'SKILL.md'), {
      name,
      description,
    });
  }
}
