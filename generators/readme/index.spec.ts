import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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
});
