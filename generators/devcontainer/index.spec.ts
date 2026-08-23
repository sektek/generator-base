import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { DevcontainerGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

const run = (options: Record<string, unknown> = {}) =>
  helper.run(generator).withOptions(options);

describe('@sektek/base:devcontainer', function () {
  it('generates using DevcontainerGenerator', async function () {
    const result = await run();
    expect(result.generator).to.be.instanceOf(DevcontainerGenerator);
  });

  describe('with the default profile', function () {
    it('generates a standalone devcontainer.json and Dockerfile', async function () {
      const { fs } = await run();
      expect(fs.exists('.devcontainer/devcontainer.json')).to.be.true;
      expect(fs.exists('.devcontainer/Dockerfile')).to.be.true;
      expect(fs.read('.devcontainer/Dockerfile')).to.include(
        'sektek/devcontainer-base',
      );
    });

    it('does not generate a docker-compose.yml', async function () {
      const { fs } = await run();
      expect(fs.exists('.devcontainer/docker-compose.yml')).to.be.false;
    });
  });

  describe('with the workspace profile', function () {
    it('generates a compose-based devcontainer.json, docker-compose.yml, and Dockerfile', async function () {
      const { fs } = await run({ profile: 'workspace' });
      expect(fs.exists('.devcontainer/devcontainer.json')).to.be.true;
      expect(fs.read('.devcontainer/devcontainer.json')).to.include(
        'dockerComposeFile',
      );
      expect(fs.exists('.devcontainer/docker-compose.yml')).to.be.true;
      expect(fs.exists('.devcontainer/Dockerfile')).to.be.true;
    });
  });
});
