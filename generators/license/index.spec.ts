import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { LicenseGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

describe('@sektek/base:license', function () {
  it('generates using LicenseGenerator', async function () {
    const result = await helper.run(generator).withOptions({ license: 'MIT' });
    expect(result.generator).to.be.instanceOf(LicenseGenerator);
  });

  describe('when license is MIT', function () {
    it('writes a LICENSE file naming the author as copyright holder', async function () {
      const { fs } = await helper.run(generator).withOptions({
        license: 'MIT',
        author: 'Edward Kelly <eddie@sektek.net>',
      });

      expect(fs.exists('LICENSE')).to.be.true;
      const content = fs.read('LICENSE');
      expect(content).to.match(/^MIT License/);
      expect(content).to.include(
        `Copyright (c) ${new Date().getFullYear()} Edward Kelly <eddie@sektek.net>`,
      );
    });

    it('leaves the copyright line empty when no author is given', async function () {
      const { fs } = await helper
        .run(generator)
        .withOptions({ license: 'MIT' });

      expect(fs.exists('LICENSE')).to.be.true;
      expect(fs.read('LICENSE')).to.include(
        `Copyright (c) ${new Date().getFullYear()} \n`,
      );
    });
  });

  describe('when license is UNLICENSED', function () {
    it('writes no LICENSE file', async function () {
      const { fs } = await helper
        .run(generator)
        .withOptions({ license: 'UNLICENSED' });

      expect(fs.exists('LICENSE')).to.be.false;
    });
  });

  describe('when license is omitted', function () {
    it('writes no LICENSE file', async function () {
      const { fs } = await helper.run(generator);

      expect(fs.exists('LICENSE')).to.be.false;
    });
  });
});
