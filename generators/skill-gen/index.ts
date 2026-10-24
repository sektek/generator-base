import {
  BaseSkillGenerator,
  SkillDefinition,
} from '../../lib/skills/base-skill-generator.js';

export class SkillGenGenerator extends BaseSkillGenerator {
  skill: SkillDefinition = {
    name: 'gen',
    description:
      'Scaffold a new project or add a component with the gen CLI, without interactive prompts. Use when asked to create, scaffold or generate a project, app, library, workspace or config file.',
    template: 'SKILL.md.ejs',
  };
}

export default SkillGenGenerator;
