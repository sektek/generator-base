import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ProviderFn, getComponent } from '@sektek/utility-belt';
import { expect, use } from 'chai';
import sinon, { SinonStub } from 'sinon';
import { helper } from '@sektek/generator-test';
import sinonChai from 'sinon-chai';

import { GitClient } from '../../lib/git/client.js';
import { GithubGenerator } from '../github/index.js';

import { GitGenerator } from './index.js';

use(sinonChai);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

const promptContext = { answers: {}, flagsGiven: {} };
const provide = <T>(
  provider: unknown,
  ctx: typeof promptContext = promptContext,
) => getComponent<ProviderFn<T, typeof promptContext>>(provider, 'get')(ctx);

type FakeGitClient = GitClient & {
  isRepoInitialized: SinonStub;
  isDestinationEmpty: SinonStub;
  initRepo: SinonStub;
  commitAll: SinonStub;
};

function fakeGitClient(
  alreadyInitialized: boolean,
  destinationEmpty = true,
): FakeGitClient {
  return {
    isRepoInitialized: sinon.stub().resolves(alreadyInitialized),
    isDestinationEmpty: sinon.stub().resolves(destinationEmpty),
    initRepo: sinon.stub().resolves(),
    commitAll: sinon.stub().resolves(),
  };
}

// GitGenerator composites github (see index.ts), and github composites
// git right back for its own standalone use — so this run needs a real,
// resolvable namespace of its own (via `settings.namespace`, not just an
// options field), matching the one github's nested composeWith('git', ...)
// resolves to. Without it, Yeoman's unique:true dedup can't recognize that
// return trip as this same top-level instance, and runs git twice.
const run = (options: Record<string, unknown> = {}) =>
  helper
    .run(generator, { namespace: '@sektek/base:git' })
    .withOptions(options)
    .withGenerators([
      [join(__dirname, 'index.js'), { namespace: '@sektek/base:git' }],
      [
        join(__dirname, '../github/index.js'),
        { namespace: '@sektek/base:github' },
      ],
    ]);

describe('@sektek/base:git', function () {
  it('generates using GitGenerator', async function () {
    const gitClient = fakeGitClient(true);
    const result = await run({ gitClient });
    expect(result.generator).to.be.instanceOf(GitGenerator);
  });

  describe('when gitInit is omitted or true', function () {
    it('inits and commits when no .git exists yet', async function () {
      const gitClient = fakeGitClient(false);

      await run({ gitClient });

      expect(gitClient.isRepoInitialized).to.have.been.calledOnce;
      expect(gitClient.initRepo).to.have.been.calledOnce;
      expect(gitClient.commitAll).to.have.been.calledOnceWith(
        sinon.match.string,
        'Initial commit',
      );
      expect(gitClient.initRepo).to.have.been.calledBefore(gitClient.commitAll);
    });

    it('does nothing when a .git already exists', async function () {
      const gitClient = fakeGitClient(true);

      await run({ gitClient });

      expect(gitClient.isRepoInitialized).to.have.been.calledOnce;
      expect(gitClient.initRepo).not.to.have.been.called;
      expect(gitClient.commitAll).not.to.have.been.called;
    });

    it('does nothing when no .git exists but the destination was not empty', async function () {
      // Guards against auto-committing pre-existing, unrelated files (e.g.
      // secrets, pending work) that happened to be sitting in the
      // destination directory before this run — git add -A would otherwise
      // sweep them into the "Initial commit" without anyone asking for that.
      const gitClient = fakeGitClient(false, false);

      await run({ gitClient });

      expect(gitClient.isDestinationEmpty).to.have.been.calledOnce;
      expect(gitClient.initRepo).not.to.have.been.called;
      expect(gitClient.commitAll).not.to.have.been.called;
    });
  });

  describe('when gitInit is false', function () {
    it('never touches the git client', async function () {
      const gitClient = fakeGitClient(false);

      await run({ gitInit: false, gitClient });

      expect(gitClient.isRepoInitialized).not.to.have.been.called;
      expect(gitClient.initRepo).not.to.have.been.called;
      expect(gitClient.commitAll).not.to.have.been.called;
    });
  });

  describe('composites()', function () {
    it('composes github', function () {
      expect(GitGenerator.composites()).to.deep.equal([
        { name: 'github', generatorClass: GithubGenerator },
      ]);
    });
  });

  describe('prompts()', function () {
    it('exposes gitInit, defaulting to true', async function () {
      const prompts = GitGenerator.prompts();
      const gitInit = prompts.find(p => p.name === 'gitInit')!;

      expect(gitInit).to.exist;
      expect(await provide(gitInit.provider)).to.equal(true);
    });

    it('shows createRepo only when gitInit is not false', async function () {
      const prompts = GitGenerator.prompts();
      const createRepo = prompts.find(p => p.name === 'createRepo')!;

      expect(createRepo).to.exist;

      const included = (ctx: typeof promptContext) =>
        getComponent<(ctx: typeof promptContext) => boolean | Promise<boolean>>(
          createRepo.includePrompt,
          'test',
        )(ctx);

      expect(
        await included({ answers: { gitInit: true }, flagsGiven: {} }),
      ).to.equal(true);
      expect(await included({ answers: {}, flagsGiven: {} })).to.equal(true);
      expect(
        await included({ answers: { gitInit: false }, flagsGiven: {} }),
      ).to.equal(false);
    });
  });
});
