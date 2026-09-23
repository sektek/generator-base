import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ProviderFn, getComponent } from '@sektek/utility-belt';
import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { AppGenerator } from './index.js';

const context = { answers: {}, flagsGiven: {} };
const provide = <T>(provider: unknown) => {
  const get: ProviderFn<T, typeof context> = getComponent(provider, 'get');
  return get(context);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

// AppGenerator composes its sub-generators by the namespace @sektek/base
// rewrites them to (see CoreGenerator#composeWith). The shared test helper
// has nothing registered under those namespaces by default, so each
// sub-generator must be registered by path (so its templates/ dir still
// resolves) under the namespace app will compose it as.
//
// gitInit: false — these tests are about composition (each sub-generator
// produces its expected files), not git's own behavior (already covered by
// its own fully-mocked spec). Without this, git's real taskEnd runs a real
// `git init`/`git commit` against the test's on-disk temp fixture, which
// depends on the running machine having a git identity configured — CI
// runners don't by default, so this was failing in CI with "Please tell me
// who you are" even though it could pass on a contributor's own machine.
const run = (options: Record<string, unknown> = {}) => {
  const withGitInitFalse: Record<string, unknown> = {
    gitInit: false,
    ...options,
  };
  return helper
    .run(generator)
    .withOptions(withGitInitFalse)
    .withGenerators([
      [
        join(__dirname, '../config/index.js'),
        { namespace: '@sektek/base:config' },
      ],
      [
        join(__dirname, '../editorconfig/index.js'),
        { namespace: '@sektek/base:editorconfig' },
      ],
      [join(__dirname, '../git/index.js'), { namespace: '@sektek/base:git' }],
      [
        join(__dirname, '../gitconfig/index.js'),
        { namespace: '@sektek/base:gitconfig' },
      ],
      [
        join(__dirname, '../github/index.js'),
        { namespace: '@sektek/base:github' },
      ],
      [
        join(__dirname, '../license/index.js'),
        { namespace: '@sektek/base:license' },
      ],
      [
        join(__dirname, '../readme/index.js'),
        { namespace: '@sektek/base:readme' },
      ],
      [
        join(__dirname, '../devcontainer/index.js'),
        { namespace: '@sektek/base:devcontainer' },
      ],
    ]);
};

describe('@sektek/base:app', function () {
  it('generates using AppGenerator', async function () {
    const result = await run();
    expect(result.generator).to.be.instanceOf(AppGenerator);
  });

  it('composes the editorconfig generator', async function () {
    const { fs } = await run();
    expect(fs.exists('.editorconfig')).to.be.true;
  });

  it('composes the gitconfig generator', async function () {
    const { fs } = await run();
    expect(fs.exists('.gitignore')).to.be.true;
    expect(fs.exists('.gitattributes')).to.be.true;
  });

  it('composes the readme generator', async function () {
    const { fs } = await run();
    expect(fs.exists('README.md')).to.be.true;
  });

  it('composes the license generator, writing no LICENSE by default', async function () {
    const { fs } = await run();
    expect(fs.exists('LICENSE')).to.be.false;
  });

  it('composes the license generator, writing a LICENSE when license is MIT', async function () {
    const { fs } = await run({ license: 'MIT' });
    expect(fs.exists('LICENSE')).to.be.true;
  });

  it('composes the devcontainer generator with the default profile', async function () {
    const { fs } = await run();
    expect(fs.exists('.devcontainer/devcontainer.json')).to.be.true;
    expect(fs.exists('.devcontainer/Dockerfile')).to.be.true;
    expect(fs.exists('.devcontainer/docker-compose.yml')).to.be.false;
  });

  it('composes the config generator', async function () {
    const { fs } = await run();
    expect(fs.exists('gen.config.yaml')).to.be.true;
  });

  describe('composites()', function () {
    it('lists every sub-generator composeWith in taskInitializing, in order', function () {
      // github isn't listed here — it's composited into git instead (see
      // git/index.spec.ts), not a top-level app concern.
      expect(AppGenerator.composites().map(({ name }) => name)).to.deep.equal([
        'editorconfig',
        'git',
        'gitconfig',
        'license',
        'readme',
        'devcontainer',
        'config',
      ]);
    });
  });

  describe('prompts()', function () {
    it("aggregates every composed sub-generator's prompts", async function () {
      const prompts = AppGenerator.prompts();
      const names = prompts.map(p => p.name);

      // gitInit and createRepo aren't app's own prompts — they surface
      // here because git composites github (see git/index.spec.ts for
      // their actual gating behavior).
      expect(names).to.include('gitInit');
      expect(names).to.include('createRepo');

      const gitInit = prompts.find(p => p.name === 'gitInit')!;
      expect(await provide(gitInit.provider)).to.equal(true);
    });
  });

  describe('destinationMode()', function () {
    it('is newProjectDir', function () {
      expect(AppGenerator.destinationMode()).to.deep.equal({
        kind: 'newProjectDir',
      });
    });
  });
});
