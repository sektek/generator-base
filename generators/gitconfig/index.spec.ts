import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { GitConfigGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

describe('@sektek/base:gitconfig', function () {
  it('generates using GitConfigGenerator', async function () {
    const result = await helper.run(generator);
    expect(result.generator).to.be.instanceOf(GitConfigGenerator);
  });

  it('generates a gitignore', async function () {
    const { fs } = await helper.run(generator);
    expect(fs.exists('.gitignore')).to.be.true;
  });

  it('generates a gitattributes', async function () {
    const { fs } = await helper.run(generator);
    expect(fs.exists('.gitattributes')).to.be.true;
  });
});
