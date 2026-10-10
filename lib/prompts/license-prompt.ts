import { PromptBuilder } from '@sektek/generator';

/**
 * The shared License prompt, read by `license` and by generator-js's
 * `base-package` and `workspace`. Import this rather than declaring a fresh
 * `license` prompt so every consumer dedupes to one question.
 */
export const licensePrompt = new PromptBuilder().create({
  name: 'license',
  type: 'text',
  label: 'License',
  provider: () => 'UNLICENSED',
});
