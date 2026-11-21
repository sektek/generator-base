import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { PromptContext, profilePrompt } from '@sektek/generator';
import { expect } from 'chai';
import { getComponent } from '@sektek/utility-belt';
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

  describe('prompts()', function () {
    const isProfileIncluded = async (generator?: string) => {
      const profile = DevcontainerGenerator.prompts().find(
        p => p.name === profilePrompt.name,
      )!;
      const test: (ctx: PromptContext) => boolean | Promise<boolean> =
        getComponent(profile.includePrompt, 'test');
      return test({
        answers: {},
        flagsGiven: {},
        configDefaults: {},
        generator,
      });
    };

    it('declares the profile prompt', function () {
      expect(DevcontainerGenerator.prompts().map(p => p.name)).to.include(
        profilePrompt.name,
      );
    });

    it('asks for the profile when base:devcontainer is requested', async function () {
      expect(await isProfileIncluded('@sektek/base:devcontainer')).to.equal(
        true,
      );
    });

    it('does not ask for the profile when only composed by base:app', async function () {
      expect(await isProfileIncluded('@sektek/base:app')).to.equal(false);
    });

    it('does not ask for the profile when no generator is set', async function () {
      expect(await isProfileIncluded()).to.equal(false);
    });
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

    it('declares no devcontainer features', async function () {
      const { fs } = await run();
      expect(
        JSON.parse(fs.read('.devcontainer/devcontainer.json')),
      ).to.not.have.property('features');
    });

    it('does not recommend the Docker VS Code extension', async function () {
      const { fs } = await run();
      const devcontainer = JSON.parse(
        fs.read('.devcontainer/devcontainer.json'),
      );

      expect(devcontainer.customizations.vscode.extensions).to.not.include(
        'ms-azuretools.vscode-docker',
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

    it('uses docker-in-docker without a Compose plugin', async function () {
      const { fs } = await run({ profile: 'workspace' });
      const { features } = JSON.parse(
        fs.read('.devcontainer/devcontainer.json'),
      );

      expect(features).to.have.property(
        'ghcr.io/devcontainers/features/docker-in-docker:4',
      );
      expect(
        features['ghcr.io/devcontainers/features/docker-in-docker:4'],
      ).to.include({ dockerDashComposeVersion: 'none' });
      expect(features).to.not.have.property(
        'ghcr.io/devcontainers/features/docker-outside-of-docker:1',
      );
    });
  });
});
