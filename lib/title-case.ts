import startCase from 'lodash/startCase.js';

/**
 * Title-cases a hyphen-separated slug (e.g. `CoreGenerator#projectSlug`)
 * for display text (README headings, etc.).
 *
 * Deliberately not derived from `Generator#appname` — appname only
 * de-hyphenates (replacing `-`/`_` with a space) without changing case at
 * all, so a conventional all-lowercase kebab-case destination directory
 * (e.g. `my-cool-project`) produces an all-lowercase `appname` (`'my cool
 * project'`), not a proper title.
 *
 * @param slug - A hyphen-separated, lowercase slug (e.g. `projectSlug`).
 * @returns The title-cased text (e.g. `'my-cool-project'` -> `'My Cool Project'`).
 */
export function titleCase(slug: string): string {
  return startCase(slug);
}

export default titleCase;
