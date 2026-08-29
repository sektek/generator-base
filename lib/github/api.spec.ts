import { expect, use } from 'chai';
import sinon, { SinonSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';

import { createRepo, getAuthenticatedUser, repoExists } from './api.js';

use(sinonChai);

// Octokit sends requests through the platform's global `fetch` by default
// (Node >=18) — stubbing it here exercises this module's own logic (which
// endpoint/params it asks Octokit for, how it maps the response, how it
// wraps a failure) without making a real network call, while leaving
// request-building details (headers, retries, etc.) to Octokit itself
// rather than re-asserting them here.
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
    it('requests /user and returns the login', async function () {
      fetchStub.resolves(jsonResponse(200, { login: 'octocat' }));

      const user = await getAuthenticatedUser({ token: 'a-token' });

      expect(user).to.deep.equal({ login: 'octocat' });
      const [url] = fetchStub.firstCall.args as [string];
      expect(url).to.equal('https://api.github.com/user');
    });

    it('throws with the status and message on failure', async function () {
      fetchStub.resolves(jsonResponse(401, { message: 'Bad credentials' }));

      try {
        await getAuthenticatedUser({ token: 'bad-token' });
        expect.fail('expected getAuthenticatedUser to throw');
      } catch (err) {
        expect((err as Error).message).to.include('401');
        expect((err as Error).message).to.include('Bad credentials');
      }
    });
  });

  describe('repoExists', function () {
    it('checks /repos/{owner}/{name} directly when owner is given, without resolving the authenticated user', async function () {
      fetchStub.resolves(jsonResponse(200, { name: 'repo' }));

      const result = await repoExists(
        { token: 'a-token' },
        { owner: 'sektek', name: 'repo' },
      );

      expect(result).to.deep.equal({ exists: true, owner: 'sektek' });
      expect(fetchStub).to.have.been.calledOnce;
      const [url] = fetchStub.firstCall.args as [string];
      expect(url).to.equal('https://api.github.com/repos/sektek/repo');
    });

    it('resolves the authenticated user first when owner is omitted, then checks under that login', async function () {
      fetchStub
        .onCall(0)
        .resolves(jsonResponse(200, { login: 'octocat' }))
        .onCall(1)
        .resolves(jsonResponse(200, { name: 'repo' }));

      const result = await repoExists({ token: 'a-token' }, { name: 'repo' });

      expect(result).to.deep.equal({ exists: true, owner: 'octocat' });
      expect(fetchStub).to.have.been.calledTwice;
      const [firstUrl] = fetchStub.firstCall.args as [string];
      const [secondUrl] = fetchStub.secondCall.args as [string];
      expect(firstUrl).to.equal('https://api.github.com/user');
      expect(secondUrl).to.equal('https://api.github.com/repos/octocat/repo');
    });

    it('returns exists: false on a 404, rather than throwing', async function () {
      fetchStub.resolves(jsonResponse(404, { message: 'Not Found' }));

      const result = await repoExists(
        { token: 'a-token' },
        { owner: 'sektek', name: 'repo' },
      );

      expect(result).to.deep.equal({ exists: false, owner: 'sektek' });
    });

    it('throws on a non-404 failure, e.g. a bad token', async function () {
      fetchStub.resolves(jsonResponse(401, { message: 'Bad credentials' }));

      try {
        await repoExists(
          { token: 'bad-token' },
          { owner: 'sektek', name: 'repo' },
        );
        expect.fail('expected repoExists to throw');
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

      const result = await createRepo(
        { token: 'a-token' },
        {
          name: 'repo',
          private: true,
        },
      );

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

      await createRepo(
        { token: 'a-token' },
        {
          owner: 'sektek',
          name: 'repo',
          private: false,
          description: 'a repo',
        },
      );

      const [url, init] = fetchStub.firstCall.args as [string, RequestInit];
      expect(url).to.equal('https://api.github.com/orgs/sektek/repos');
      expect(JSON.parse(init.body as string)).to.deep.equal({
        name: 'repo',
        private: false,
        description: 'a repo',
        auto_init: false,
      });
    });

    it('throws with the status and message on failure', async function () {
      fetchStub.resolves(
        jsonResponse(422, { message: 'name already exists on this account' }),
      );

      try {
        await createRepo({ token: 'a-token' }, { name: 'repo', private: true });
        expect.fail('expected createRepo to throw');
      } catch (err) {
        expect((err as Error).message).to.include('422');
        expect((err as Error).message).to.include(
          'name already exists on this account',
        );
      }
    });

    it('throws when the response is missing clone_url/ssh_url', async function () {
      fetchStub.resolves(
        jsonResponse(201, {
          clone_url: null,
          ssh_url: null,
          html_url: 'https://github.com/octocat/repo',
        }),
      );

      try {
        await createRepo({ token: 'a-token' }, { name: 'repo', private: true });
        expect.fail('expected createRepo to throw');
      } catch (err) {
        expect((err as Error).message).to.include('repo');
        expect((err as Error).message).to.include('clone_url');
      }
    });
  });
});
