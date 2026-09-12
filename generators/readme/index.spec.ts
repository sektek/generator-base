import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { ReadmeGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

describe('@sektek/base:readme', function () {
  it('generates using ReadmeGenerator', async function () {
    const result = await helper.run(generator);
    expect(result.generator).to.be.instanceOf(ReadmeGenerator);
  });

  it('generates a README.md', async function () {
    const { fs } = await helper.run(generator);
    expect(fs.exists('README.md')).to.be.true;
  });

  it('title-cases a kebab-case destination directory in the README heading', async function () {
    // destinationRoot is a real, named directory (not the run context's
    // default temp one) to exercise the heading against an actual
    // hyphenated folder name — see generator-js's base-package spec for
    // the same pattern.
    const destinationRoot = join(
      tmpdir(),
      'sektek-base-readme-spec',
      'my-cool-project',
    );
    const { fs } = await helper.run(generator).withOptions({
      destinationRoot,
    });
    expect(fs.read(join(destinationRoot, 'README.md'))).to.match(
      /^# My Cool Project$/m,
    );
  });
});
