import { expect, use } from 'chai';
import sinon, { SinonSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';

import { createRepo, getAuthenticatedUser } from './api.js';

use(sinonChai);

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('lib/github/api', function () {
  let sandbox: SinonSandbox;
  let fetchStub: SinonStub;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    fetchStub = sandbox.stub(globalThis, 'fetch');
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getAuthenticatedUser', function () {
    it('requests /user with the bearer token', async function () {
      fetchStub.resolves(jsonResponse(200, { login: 'octocat' }));

      const user = await getAuthenticatedUser('a-token');

      expect(user).to.deep.equal({ login: 'octocat' });
      expect(fetchStub).to.have.been.calledWith(
        'https://api.github.com/user',
        sinon.match({
          headers: sinon.match({
            Authorization: 'Bearer a-token',
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          }),
        }),
      );
    });

    it('throws with the status and message on failure', async function () {
      fetchStub.resolves(jsonResponse(401, { message: 'Bad credentials' }));

      try {
        await getAuthenticatedUser('bad-token');
        expect.fail('expected getAuthenticatedUser to throw');
      } catch (err) {
        expect((err as Error).message).to.include('401');
        expect((err as Error).message).to.include('Bad credentials');
      }
    });
  });

  describe('createRepo', function () {
    it('posts to /user/repos when no owner is given', async function () {
      fetchStub.resolves(
        jsonResponse(201, {
          clone_url: 'https://github.com/octocat/repo.git',
          ssh_url: 'git@github.com:octocat/repo.git',
          html_url: 'https://github.com/octocat/repo',
        }),
      );

      const result = await createRepo('a-token', {
        name: 'repo',
        private: true,
      });

      expect(result).to.deep.equal({
        cloneUrl: 'https://github.com/octocat/repo.git',
        sshUrl: 'git@github.com:octocat/repo.git',
        htmlUrl: 'https://github.com/octocat/repo',
      });
      const [url, init] = fetchStub.firstCall.args as [string, RequestInit];
      expect(url).to.equal('https://api.github.com/user/repos');
      expect(init.method).to.equal('POST');
      expect(JSON.parse(init.body as string)).to.deep.equal({
        name: 'repo',
        private: true,
        auto_init: false,
      });
    });

    it('posts to /orgs/{owner}/repos when an owner is given', async function () {
      fetchStub.resolves(
        jsonResponse(201, {
          clone_url: 'https://github.com/sektek/repo.git',
          ssh_url: 'git@github.com:sektek/repo.git',
          html_url: 'https://github.com/sektek/repo',
        }),
      );

      await createRepo('a-token', {
        owner: 'sektek',
        name: 'repo',
        private: false,
        description: 'a repo',
      });

      const [url] = fetchStub.firstCall.args as [string, RequestInit];
      expect(url).to.equal('https://api.github.com/orgs/sektek/repos');
    });

    it('throws with the status and message on failure', async function () {
      fetchStub.resolves(
        jsonResponse(422, { message: 'name already exists on this account' }),
      );

      try {
        await createRepo('a-token', { name: 'repo', private: true });
        expect.fail('expected createRepo to throw');
      } catch (err) {
        expect((err as Error).message).to.include('422');
        expect((err as Error).message).to.include(
          'name already exists on this account',
        );
      }
    });
  });
});
