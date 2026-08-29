import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect, use } from 'chai';
import sinon, { SinonStub } from 'sinon';
import { helper } from '@sektek/generator-test';
import sinonChai from 'sinon-chai';

import { GitClient } from '../../lib/git/client.js';

import { GitGenerator } from './index.js';

use(sinonChai);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

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

describe('@sektek/base:git', function () {
  it('generates using GitGenerator', async function () {
    const gitClient = fakeGitClient(true);
    const result = await helper.run(generator).withOptions({ gitClient });
    expect(result.generator).to.be.instanceOf(GitGenerator);
  });

  describe('when gitInit is omitted or true', function () {
    it('inits and commits when no .git exists yet', async function () {
      const gitClient = fakeGitClient(false);

      await helper.run(generator).withOptions({ gitClient });

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

      await helper.run(generator).withOptions({ gitClient });

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

      await helper.run(generator).withOptions({ gitClient });

      expect(gitClient.isDestinationEmpty).to.have.been.calledOnce;
      expect(gitClient.initRepo).not.to.have.been.called;
      expect(gitClient.commitAll).not.to.have.been.called;
    });
  });

  describe('when gitInit is false', function () {
    it('never touches the git client', async function () {
      const gitClient = fakeGitClient(false);

      await helper.run(generator).withOptions({ gitInit: false, gitClient });

      expect(gitClient.isRepoInitialized).not.to.have.been.called;
      expect(gitClient.initRepo).not.to.have.been.called;
      expect(gitClient.commitAll).not.to.have.been.called;
    });
  });
});
