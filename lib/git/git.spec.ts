import childProcess from 'node:child_process';
import fs from 'node:fs';

import { expect, use } from 'chai';
import sinon, { SinonSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';

import { commitAll, ensureRepoInitialized } from './git.js';

use(sinonChai);

describe('lib/git/git', function () {
  let sandbox: SinonSandbox;
  let execFileStub: SinonStub;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    execFileStub = sandbox
      .stub(childProcess, 'execFile')
      // @ts-expect-error - sinon's fake doesn't match execFile's overloads
      .callsArgWith(3, null, { stdout: '', stderr: '' });
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('ensureRepoInitialized', function () {
    it('does not run git init and returns false when .git already exists', async function () {
      sandbox.stub(fs, 'existsSync').returns(true);

      const result = await ensureRepoInitialized('/repo');

      expect(result).to.be.false;
      expect(execFileStub).not.to.have.been.called;
    });

    it('runs git init -b main and returns true when .git does not exist', async function () {
      sandbox.stub(fs, 'existsSync').returns(false);

      const result = await ensureRepoInitialized('/repo');

      expect(result).to.be.true;
      expect(execFileStub).to.have.been.calledOnceWith(
        'git',
        ['init', '-b', 'main'],
        { cwd: '/repo' },
      );
    });
  });

  describe('commitAll', function () {
    it('runs git add -A then git commit -m <message>, in order', async function () {
      await commitAll('/repo', 'Initial commit');

      expect(execFileStub).to.have.been.calledTwice;
      expect(execFileStub.firstCall).to.have.been.calledWith(
        'git',
        ['add', '-A'],
        { cwd: '/repo' },
      );
      expect(execFileStub.secondCall).to.have.been.calledWith(
        'git',
        ['commit', '-m', 'Initial commit'],
        { cwd: '/repo' },
      );
    });
  });
});
