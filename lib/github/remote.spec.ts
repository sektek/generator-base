import childProcess from 'node:child_process';

import { expect, use } from 'chai';
import sinon, { SinonSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';

import { addRemote, push } from './remote.js';

use(sinonChai);

describe('lib/github/remote', function () {
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

  describe('addRemote', function () {
    it('shells out to `git remote add`', async function () {
      await addRemote('/repo', 'origin', 'git@github.com:owner/repo.git');

      expect(execFileStub).to.have.been.calledWith(
        'git',
        ['remote', 'add', 'origin', 'git@github.com:owner/repo.git'],
        { cwd: '/repo' },
      );
    });
  });

  describe('push', function () {
    it('shells out to `git push` with a per-invocation auth header', async function () {
      await push('/repo', { token: 'a-token' }, 'origin', 'main');

      expect(execFileStub).to.have.been.calledWith(
        'git',
        [
          '-c',
          'http.extraHeader=AUTHORIZATION: bearer a-token',
          'push',
          '-u',
          'origin',
          'main',
        ],
        { cwd: '/repo' },
      );
    });

    it('passes the token only via the extraHeader flag, not the remote arg', async function () {
      await push('/repo', { token: 'a-token' }, 'origin', 'main');

      const [, args] = execFileStub.firstCall.args as [string, string[]];
      expect(args[args.length - 2]).to.equal('origin');
      expect(args.filter(arg => arg.includes('a-token'))).to.deep.equal([
        'http.extraHeader=AUTHORIZATION: bearer a-token',
      ]);
    });
  });
});
