import {
  Composite,
  DestinationMode,
  Prompt,
  PromptBuilder,
} from '@sektek/generator';

import { SkillScope, scopePrompt } from '../../lib/skills/skill-scope.js';
import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

export type SkillsOptions = BaseOptions & {
  /** Names of the skills to install. Defaults to every skill. */
  skills?: string[];

  /** `project` installs into the destination; `user` into the home directory. Defaults to `project`. */
  scope?: SkillScope;
};

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

const COMPOSITES = [] satisfies Composite[];

// A skill generator `@scope/pkg:skill-<name>` installs the skill `<name>`.
const skillNameOf = ({ name }: Composite) =>
  name.slice(name.lastIndexOf(':') + 1).replace(/^skill-/, '');

/**
 * Installs agent skills, per project or per user, by composing the skill
 * generator of each skill asked for. Skill generators share this
 * generator's prompts, so they can also be run alone.
 */
export class SkillsGenerator extends BaseGenerator<
  BaseConfig,
  SkillsOptions,
  BaseFeatures
> {
  static composites(): Composite[] {
    return COMPOSITES;
  }

  static destinationMode(): DestinationMode {
    return { kind: 'inPlace' };
  }

  static prompts(): Prompt[] {
    const names = this.composites().map(skillNameOf);

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
    const requested = this.requestedSkills();

    for (const composite of this.skillComposites()) {
      if (requested.includes(skillNameOf(composite))) {
        await this.composeWith(composite.name, this.options, true);
      }
    }
  }

  taskInitializing() {
    const valid = this.skillComposites().map(skillNameOf);
    const unknown = this.requestedSkills().filter(
      name => !valid.includes(name),
    );

    if (unknown.length > 0) {
      throw new Error(
        `Unknown skill${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. ` +
          `Valid skills: ${valid.join(', ') || '(none)'}`,
      );
    }
  }

  private skillComposites(): Composite[] {
    return (this.constructor as typeof SkillsGenerator).composites();
  }

  private requestedSkills(): string[] {
    return this.options.skills ?? this.skillComposites().map(skillNameOf);
  }
}

export default SkillsGenerator;
