import childProcess from 'node:child_process';
import fs from 'node:fs';

import { expect, use } from 'chai';
import sinon, { SinonSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';

import {
  commitAll,
  initRepo,
  isDestinationEmpty,
  isRepoInitialized,
} from './git.js';

use(sinonChai);

describe('lib/git/git', function () {
  let sandbox: SinonSandbox;
  let execFileStub: SinonStub;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    execFileStub = sandbox
      .stub(childProcess, 'execFile')
      // @ts-expect-error - sinon's fake doesn't match execFile's overloads
      // Node's real execFile callback is (error, stdout, stderr) — three
      // separate arguments, not one { stdout, stderr } object — matching
      // that here so a future change that reads stdout/stderr wouldn't
      // silently misread a stubbed shape that the real callback never sends.
      .callsArgWith(3, null, '', '');
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('isRepoInitialized', function () {
    it('returns true when .git already exists, without running git', async function () {
      sandbox.stub(fs, 'existsSync').returns(true);

      const result = await isRepoInitialized('/repo');

      expect(result).to.be.true;
      expect(execFileStub).not.to.have.been.called;
    });

    it('returns false when .git does not exist, without running git', async function () {
      sandbox.stub(fs, 'existsSync').returns(false);

      const result = await isRepoInitialized('/repo');

      expect(result).to.be.false;
      expect(execFileStub).not.to.have.been.called;
    });
  });

  describe('isDestinationEmpty', function () {
    it('returns true when the directory does not exist yet, without reading it', async function () {
      sandbox.stub(fs, 'existsSync').returns(false);
      const readdirStub = sandbox.stub(fs, 'readdirSync');

      const result = await isDestinationEmpty('/repo');

      expect(result).to.be.true;
      expect(readdirStub).not.to.have.been.called;
    });

    it('returns true when the directory exists but has no entries', async function () {
      sandbox.stub(fs, 'existsSync').returns(true);
      // @ts-expect-error - sinon's fake doesn't match readdirSync's overloads
      sandbox.stub(fs, 'readdirSync').returns([]);

      const result = await isDestinationEmpty('/repo');

      expect(result).to.be.true;
    });

    it('returns false when the directory has existing entries', async function () {
      sandbox.stub(fs, 'existsSync').returns(true);
      // @ts-expect-error - sinon's fake doesn't match readdirSync's overloads
      sandbox.stub(fs, 'readdirSync').returns(['.env', 'notes.txt']);

      const result = await isDestinationEmpty('/repo');

      expect(result).to.be.false;
    });
  });

  describe('initRepo', function () {
    it('runs git init -b main', async function () {
      await initRepo('/repo');

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
