import { homedir } from 'node:os';
import { join } from 'node:path';

import { PromptBuilder } from '@sektek/generator';

/** Where skills are installed: the destination project, or the user's home. */
export type SkillScope = 'project' | 'user';

/** The agent tooling skills are installed for. */
export type SkillHarness = 'claude';

/**
 * The shared "Scope" prompt every skill generator reads: `project` (the
 * default) installs into the destination, `user` into the home directory.
 * Import this rather than declaring a fresh `scope` prompt so `base:skills`
 * and the skills it composes dedupe to one question.
 */
export const scopePrompt = new PromptBuilder().create({
  name: 'scope',
  type: 'select',
  label: 'Install skills for this project or for the current user',
  choices: ['project', 'user'],
  provider: () => 'project',
});

const HARNESS_SKILLS_DIRECTORY: Record<SkillHarness, string> = {
  claude: join('.claude', 'skills'),
};

/**
 * Resolves the directory a harness reads skills from.
 *
 * @param harness - The agent tooling the skills are for.
 * @param scope - `project` roots it at `destination`; `user` roots it at the
 * user's home directory and ignores `destination`.
 * @param destination - The destination root of the run.
 * @returns The directory holding one subdirectory per skill.
 */
export function skillsDirectory(
  harness: SkillHarness,
  scope: SkillScope,
  destination: string,
): string {
  return join(
    scope === 'user' ? homedir() : destination,
    HARNESS_SKILLS_DIRECTORY[harness],
  );
}
