import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { EditorConfigGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

describe('@sektek/base:editorconfig', function () {
  it('generates using EditorConfigGenerator', async function () {
    const result = await helper.run(generator);
    expect(result.generator).to.be.instanceOf(EditorConfigGenerator);
  });

  it('generates an editorconfig', async function () {
    const { fs } = await helper.run(generator);
    expect(fs.exists('.editorconfig')).to.be.true;
  });
});
