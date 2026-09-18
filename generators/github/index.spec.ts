import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { PredicateFn, ProviderFn, getComponent } from '@sektek/utility-belt';
import { PromptContext, clearable } from '@sektek/generator';
import { expect, use } from 'chai';
import sinon, { SinonStub } from 'sinon';
import { helper } from '@sektek/generator-test';
import sinonChai from 'sinon-chai';

import { GitClient } from '../../lib/git/client.js';
import { GithubClient } from '../../lib/github/client.js';
import { deriveGithubToken } from '../../lib/github/token.js';

import { GithubGenerator } from './index.js';

use(sinonChai);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

// GithubGenerator composites git (see index.ts) for standalone use, and
// git in turn composites github right back — so this run needs a real,
// resolvable namespace of its own (via `settings.namespace`), matching the
// one git's nested composeWith('github', ...) resolves to, or Yeoman's
// unique:true dedup can't recognize that return trip as this same
// top-level instance and runs github twice.
//
// gitClient defaults to a fake here, same reason app/index.spec.ts
// defaults gitInit: false — these tests are about github's own behavior,
// not git's real init/commit against the test's on-disk temp fixture.
const run = (options: Record<string, unknown> = {}) => {
  const withGitClient: Record<string, unknown> = {
    gitClient: fakeGitClient(),
    ...options,
  };
  return helper
    .run(generator, { namespace: '@sektek/base:github' })
    .withOptions(withGitClient)
    .withGenerators([
      [join(__dirname, '../git/index.js'), { namespace: '@sektek/base:git' }],
      [join(__dirname, 'index.js'), { namespace: '@sektek/base:github' }],
    ]);
};

type FakeGithubClient = GithubClient & {
  resolveToken: SinonStub;
  getAuthenticatedUser: SinonStub;
  repoExists: SinonStub;
  createRepo: SinonStub;
  addRemote: SinonStub;
  push: SinonStub;
};

function fakeGithubClient(): FakeGithubClient {
  return {
    resolveToken: sinon.stub().resolves('fake-token'),
    getAuthenticatedUser: sinon.stub().resolves({ login: 'someone' }),
    // Defaults to "doesn't exist yet" so every pre-existing happy-path test
    // below reaches createRepo/addRemote/push unchanged; the "already
    // exists" describe block overrides this per-test.
    repoExists: sinon.stub().resolves({ exists: false, owner: 'someone' }),
    createRepo: sinon.stub().resolves({
      cloneUrl: 'https://github.com/someone/my-project.git',
      sshUrl: 'git@github.com:someone/my-project.git',
      htmlUrl: 'https://github.com/someone/my-project',
    }),
    addRemote: sinon.stub().resolves(),
    push: sinon.stub().resolves(),
  };
}

type FakeGitClient = GitClient & {
  isRepoInitialized: SinonStub;
  isDestinationEmpty: SinonStub;
  initRepo: SinonStub;
  commitAll: SinonStub;
};

function fakeGitClient(): FakeGitClient {
  return {
    isRepoInitialized: sinon.stub().resolves(false),
    isDestinationEmpty: sinon.stub().resolves(true),
    initRepo: sinon.stub().resolves(),
    commitAll: sinon.stub().resolves(),
  };
}

describe('@sektek/base:github', function () {
  it('generates using GithubGenerator', async function () {
    const githubClient = fakeGithubClient();
    const result = await run({ githubClient });
    expect(result.generator).to.be.instanceOf(GithubGenerator);
  });

  describe('when createRepo is false or omitted', function () {
    it('does nothing', async function () {
      const githubClient = fakeGithubClient();

      await run({ githubClient });

      expect(githubClient.resolveToken).not.to.have.been.called;
      expect(githubClient.createRepo).not.to.have.been.called;
      expect(githubClient.addRemote).not.to.have.been.called;
      expect(githubClient.push).not.to.have.been.called;
    });
  });

  describe('when createRepo is true', function () {
    it('resolves the token, checks for a collision, creates the repo, adds the remote, and pushes, in order', async function () {
      const githubClient = fakeGithubClient();

      await run({ createRepo: true, githubClient });

      expect(githubClient.resolveToken).to.have.been.calledOnceWith(undefined);
      expect(githubClient.repoExists).to.have.been.calledOnceWith(
        { token: 'fake-token' },
        sinon.match({ owner: undefined }),
      );
      expect(githubClient.createRepo).to.have.been.calledOnce;
      expect(githubClient.addRemote).to.have.been.calledOnceWith(
        sinon.match.string,
        'origin',
        'https://github.com/someone/my-project.git',
      );
      expect(githubClient.push).to.have.been.calledOnceWith(
        sinon.match.string,
        { token: 'fake-token' },
        'origin',
        'main',
      );

      expect(githubClient.resolveToken).to.have.been.calledBefore(
        githubClient.repoExists,
      );
      expect(githubClient.repoExists).to.have.been.calledBefore(
        githubClient.createRepo,
      );
      expect(githubClient.createRepo).to.have.been.calledBefore(
        githubClient.addRemote,
      );
      expect(githubClient.addRemote).to.have.been.calledBefore(
        githubClient.push,
      );
    });

    it('defaults visibility to private', async function () {
      const githubClient = fakeGithubClient();

      await run({ createRepo: true, githubClient });

      expect(githubClient.createRepo).to.have.been.calledWith(
        sinon.match.any,
        sinon.match({ private: true }),
      );
    });

    it('maps repoVisibility: "public" to private: false', async function () {
      const githubClient = fakeGithubClient();

      await run({
        createRepo: true,
        repoVisibility: 'public',
        githubClient,
      });

      expect(githubClient.createRepo).to.have.been.calledWith(
        sinon.match.any,
        sinon.match({ private: false }),
      );
    });

    it('maps repoVisibility: "private" to private: true', async function () {
      const githubClient = fakeGithubClient();

      await run({
        createRepo: true,
        repoVisibility: 'private',
        githubClient,
      });

      expect(githubClient.createRepo).to.have.been.calledWith(
        sinon.match.any,
        sinon.match({ private: true }),
      );
    });

    it('passes repoOwner through when given', async function () {
      const githubClient = fakeGithubClient();

      await run({
        createRepo: true,
        repoOwner: 'some-org',
        githubClient,
      });

      expect(githubClient.createRepo).to.have.been.calledWith(
        sinon.match.any,
        sinon.match({ owner: 'some-org' }),
      );
    });

    it('leaves owner undefined when repoOwner is omitted', async function () {
      const githubClient = fakeGithubClient();

      await run({ createRepo: true, githubClient });

      expect(githubClient.createRepo).to.have.been.calledWith(
        sinon.match.any,
        sinon.match({ owner: undefined }),
      );
    });

    it('uses projectSlug as the repo name', async function () {
      const githubClient = fakeGithubClient();

      const result = await run({
        createRepo: true,
        githubClient,
      });

      const instance = result.generator as GithubGenerator;
      expect(githubClient.createRepo).to.have.been.calledWith(
        sinon.match.any,
        sinon.match({ name: instance.projectSlug }),
      );
    });
  });

  describe('when the target repo already exists', function () {
    it('throws before creating/pushing anything, naming the owner and repo', async function () {
      const githubClient = fakeGithubClient();
      githubClient.repoExists.resolves({ exists: true, owner: 'someone' });

      try {
        await run({ createRepo: true, githubClient });
        expect.fail('expected run to throw');
      } catch (err) {
        expect((err as Error).message).to.include('someone/');
        expect((err as Error).message).to.include('already exists');
      }

      expect(githubClient.createRepo).not.to.have.been.called;
      expect(githubClient.addRemote).not.to.have.been.called;
      expect(githubClient.push).not.to.have.been.called;
    });

    it('names the resolved owner, not "undefined", when repoOwner was omitted', async function () {
      const githubClient = fakeGithubClient();
      githubClient.repoExists.resolves({ exists: true, owner: 'someone' });

      try {
        await run({ createRepo: true, githubClient });
        expect.fail('expected run to throw');
      } catch (err) {
        expect((err as Error).message).not.to.include('undefined/');
      }
    });

    it('checks against repoOwner when given', async function () {
      const githubClient = fakeGithubClient();
      githubClient.repoExists.resolves({ exists: false, owner: 'some-org' });

      await run({
        createRepo: true,
        repoOwner: 'some-org',
        githubClient,
      });

      expect(githubClient.repoExists).to.have.been.calledOnceWith(
        sinon.match.any,
        sinon.match({ owner: 'some-org' }),
      );
    });
  });

  describe('when push is false', function () {
    it('runs every step except push', async function () {
      const githubClient = fakeGithubClient();

      await run({
        createRepo: true,
        push: false,
        githubClient,
      });

      expect(githubClient.resolveToken).to.have.been.calledOnce;
      expect(githubClient.createRepo).to.have.been.calledOnce;
      expect(githubClient.addRemote).to.have.been.calledOnce;
      expect(githubClient.push).not.to.have.been.called;
    });
  });

  describe('when gitInit is false', function () {
    it('skips repo creation entirely, even when createRepo is true', async function () {
      const githubClient = fakeGithubClient();

      await run({ gitInit: false, createRepo: true, githubClient });

      expect(githubClient.resolveToken).not.to.have.been.called;
      expect(githubClient.repoExists).not.to.have.been.called;
      expect(githubClient.createRepo).not.to.have.been.called;
      expect(githubClient.addRemote).not.to.have.been.called;
      expect(githubClient.push).not.to.have.been.called;
    });
  });

  describe('prompts()', function () {
    const provide = <T>(provider: unknown, context: PromptContext) => {
      const get: ProviderFn<T, PromptContext> = getComponent(provider, 'get');
      return get(context);
    };
    const included = (includePrompt: unknown, context: PromptContext) => {
      const test: PredicateFn<PromptContext> = getComponent(
        includePrompt,
        'test',
      );
      return test(context);
    };

    it('exposes createRepo, defaulting to false', async function () {
      const prompts = GithubGenerator.prompts();
      const createRepo = prompts.find(p => p.name === 'createRepo')!;

      expect(createRepo).to.exist;
      const context = { answers: {}, flagsGiven: {} };
      expect(await provide(createRepo.provider, context)).to.equal(false);
    });

    it('exposes repoOwner, shown only when createRepo is true, defaulting to the personal account (undefined)', async function () {
      const prompts = GithubGenerator.prompts();
      const repoOwner = prompts.find(p => p.name === 'repoOwner')!;

      expect(repoOwner).to.exist;
      expect(
        await provide(repoOwner.provider, { answers: {}, flagsGiven: {} }),
      ).to.equal(undefined);
      expect(
        await included(repoOwner.includePrompt, {
          answers: { createRepo: false },
          flagsGiven: {},
        }),
      ).to.equal(false);
      expect(
        await included(repoOwner.includePrompt, {
          answers: { createRepo: true },
          flagsGiven: {},
        }),
      ).to.equal(true);
      expect(repoOwner.capabilities).to.deep.equal([clearable]);
    });

    it('exposes githubToken, shown only when createRepo is true, deriving its default the same way resolveToken does', async function () {
      const prompts = GithubGenerator.prompts();
      const githubToken = prompts.find(p => p.name === 'githubToken')!;

      expect(githubToken).to.exist;
      expect(githubToken.provider).to.equal(deriveGithubToken);
      expect(
        await included(githubToken.includePrompt, {
          answers: { createRepo: false },
          flagsGiven: {},
        }),
      ).to.equal(false);
      expect(
        await included(githubToken.includePrompt, {
          answers: { createRepo: true },
          flagsGiven: {},
        }),
      ).to.equal(true);
      expect(githubToken.capabilities).to.deep.equal([clearable]);
    });
  });
});
