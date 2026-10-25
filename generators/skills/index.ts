import { DestinationMode, Prompt, PromptBuilder } from '@sektek/generator';

import { SkillScope, scopePrompt } from '../../lib/skills/skill-scope.js';
import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';
import { GENERATORS } from '../../manifest.js';

export type SkillsOptions = BaseOptions & {
  /** Names of the skills to install. Defaults to every skill. */
  skills?: string[];

  /** `project` installs into the destination; `user` into the home directory. Defaults to `project`. */
  scope?: SkillScope;
};

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

const SKILL_PREFIX = 'skill-';

/**
 * Installs agent skills, per project or per user. Each skill is its own
 * generator, `skill-<name>` in this package, composed by name when it is
 * asked for, so adding a skill needs no change here. Skill generators read
 * only this generator's prompts, so they can also be run alone.
 */
export class SkillsGenerator extends BaseGenerator<
  BaseConfig,
  SkillsOptions,
  BaseFeatures
> {
  /**
   * The skills this generator can install: one per `skill-<name>` generator
   * in the package manifest.
   *
   * @returns The skill names.
   */
  static skills(): string[] {
    return GENERATORS.filter(name => name.startsWith(SKILL_PREFIX)).map(name =>
      name.slice(SKILL_PREFIX.length),
    );
  }

  static destinationMode(): DestinationMode {
    return { kind: 'inPlace' };
  }

  static prompts(): Prompt[] {
    const names = this.skills();

    return [
      new PromptBuilder().create({
        name: 'skills',
        type: 'list',
        label: 'Skills to install (comma-delimited)',
        provider: () => names,
      }),
      scopePrompt,
      ...super.prompts(),
    ];
  }

  constructor(
    args: string[],
    options: SkillsOptions,
    features: BaseFeatures = {} as BaseFeatures,
  ) {
    super(args, options, {
      ...DEFAULT_FEATURES,
      ...features,
    });
  }

  async beforeQueue() {
    const available = this.availableSkills();

    for (const name of this.requestedSkills()) {
      if (available.includes(name)) {
        await this.composeWith(`${SKILL_PREFIX}${name}`, this.options, true);
      }
    }
  }

  taskInitializing() {
    const available = this.availableSkills();
    const unknown = this.requestedSkills().filter(
      name => !available.includes(name),
    );

    if (unknown.length > 0) {
      throw new Error(
        `Unknown skill${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. ` +
          `Valid skills: ${available.join(', ') || '(none)'}`,
      );
    }
  }

  private availableSkills(): string[] {
    return (this.constructor as typeof SkillsGenerator).skills();
  }

  private requestedSkills(): string[] {
    return this.options.skills ?? this.availableSkills();
  }
}

export default SkillsGenerator;
