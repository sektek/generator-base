import { createRequire } from 'node:module';

import { expect } from 'chai';
import sinon from 'sinon';

import { commitAll, ensureRepoInitialized } from './git.js';

// Same `createRequire` object git.ts itself resolves `execFile`/`existsSync`
// off of — see the comment in git.ts for why a plain `import` can't be
// stubbed here.
const require = createRequire(import.meta.url);
const childProcess =
  require('node:child_process') as typeof import('node:child_process');
const fs = require('node:fs') as typeof import('node:fs');

type ExecFileNodeStyleCompletion = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void;

const stubExecFileSuccess = () =>
  sinon.stub(childProcess, 'execFile').callsFake((...args: unknown[]) => {
    const onComplete = args[args.length - 1] as ExecFileNodeStyleCompletion;
    onComplete(null, '', '');
    return {} as ReturnType<typeof childProcess.execFile>;
  });

describe('git', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('ensureRepoInitialized', function () {
    it('does not run git init and returns false when .git already exists', async function () {
      sinon.stub(fs, 'existsSync').returns(true);
      const execFileStub = stubExecFileSuccess();

      const result = await ensureRepoInitialized('/repo');

      expect(result).to.be.false;
      expect(execFileStub.called).to.be.false;
    });

    it('runs git init -b main and returns true when .git does not exist', async function () {
      sinon.stub(fs, 'existsSync').returns(false);
      const execFileStub = stubExecFileSuccess();

      const result = await ensureRepoInitialized('/repo');

      expect(result).to.be.true;
      expect(execFileStub.calledOnce).to.be.true;
      expect(execFileStub.firstCall.args[0]).to.equal('git');
      expect(execFileStub.firstCall.args[1]).to.deep.equal([
        'init',
        '-b',
        'main',
      ]);
      expect(execFileStub.firstCall.args[2]).to.deep.equal({ cwd: '/repo' });
    });
  });

  describe('commitAll', function () {
    it('runs git add -A then git commit -m <message>, in order', async function () {
      const execFileStub = stubExecFileSuccess();

      await commitAll('/repo', 'feat: initial commit');

      expect(execFileStub.calledTwice).to.be.true;
      expect(execFileStub.firstCall.args[0]).to.equal('git');
      expect(execFileStub.firstCall.args[1]).to.deep.equal(['add', '-A']);
      expect(execFileStub.firstCall.args[2]).to.deep.equal({ cwd: '/repo' });
      expect(execFileStub.secondCall.args[0]).to.equal('git');
      expect(execFileStub.secondCall.args[1]).to.deep.equal([
        'commit',
        '-m',
        'feat: initial commit',
      ]);
      expect(execFileStub.secondCall.args[2]).to.deep.equal({ cwd: '/repo' });
    });
  });
});
