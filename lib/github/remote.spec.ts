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
      // Node's real execFile callback is (error, stdout, stderr) — three
      // separate arguments, not one { stdout, stderr } object.
      .callsArgWith(3, null, '', '');
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
    it('shells out to `git push -u <remote> <branch>`', async function () {
      await push('/repo', { token: 'a-token' }, 'origin', 'main');

      expect(execFileStub).to.have.been.calledWith(
        'git',
        ['push', '-u', 'origin', 'main'],
        sinon.match({ cwd: '/repo' }),
      );
    });

    it('authenticates via GIT_CONFIG_* env vars, never argv', async function () {
      await push('/repo', { token: 'a-token' }, 'origin', 'main');

      const [, args, options] = execFileStub.firstCall.args as [
        string,
        string[],
        { env?: Record<string, string> },
      ];

      // The whole point: a token in argv is visible to any local user via
      // `ps`/process listings. Passed via the child process's own
      // environment instead, it isn't.
      expect(args.some(arg => arg.includes('a-token'))).to.be.false;
      expect(options.env).to.deep.include({
        GIT_CONFIG_COUNT: '1',
        GIT_CONFIG_KEY_0: 'http.extraHeader',
        GIT_CONFIG_VALUE_0: 'AUTHORIZATION: bearer a-token',
      });
    });
  });
});
