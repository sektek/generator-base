import childProcess from 'node:child_process';

import { expect, use } from 'chai';
import sinon, { SinonSandbox } from 'sinon';
import chaiAsPromised from 'chai-as-promised';

import { resolveToken } from './token.js';

use(chaiAsPromised);

describe('lib/github/token', function () {
  let sandbox: SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('resolveToken', function () {
    it('returns the explicit token when given', async function () {
      process.env.GITHUB_TOKEN = 'from-env';

      const token = await resolveToken('explicit-token');

      expect(token).to.equal('explicit-token');
    });

    it('falls back to GITHUB_TOKEN when no explicit token is given', async function () {
      process.env.GITHUB_TOKEN = 'from-github-token';
      process.env.GH_TOKEN = 'from-gh-token';

      const token = await resolveToken();

      expect(token).to.equal('from-github-token');
    });

    it('falls back to GH_TOKEN when GITHUB_TOKEN is unset', async function () {
      process.env.GH_TOKEN = 'from-gh-token';

      const token = await resolveToken();

      expect(token).to.equal('from-gh-token');
    });

    it('falls back to `gh auth token` when no env vars are set', async function () {
      sandbox
        .stub(childProcess, 'execFile')
        // @ts-expect-error - sinon's fake doesn't match execFile's overloads
        .callsArgWith(2, null, { stdout: 'from-gh-cli\n', stderr: '' });

      const token = await resolveToken();

      expect(token).to.equal('from-gh-cli');
    });

    it('throws a descriptive error when nothing resolves', async function () {
      sandbox
        .stub(childProcess, 'execFile')
        // @ts-expect-error - sinon's fake doesn't match execFile's overloads
        .callsArgWith(2, new Error('not installed'));

      await expect(resolveToken()).to.be.rejectedWith(/GITHUB_TOKEN|GH_TOKEN/);
    });

    it('falls through to the error when `gh auth token` prints nothing', async function () {
      sandbox
        .stub(childProcess, 'execFile')
        // @ts-expect-error - sinon's fake doesn't match execFile's overloads
        .callsArgWith(2, null, { stdout: '', stderr: '' });

      await expect(resolveToken()).to.be.rejectedWith(
        /Unable to resolve a GitHub token/,
      );
    });
  });
});
