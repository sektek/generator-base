import { expect } from 'chai';

import { defaultGithubClient } from './index.js';

describe('index', function () {
  it('exports defaultGithubClient as a function', function () {
    expect(defaultGithubClient).to.be.a('function');
  });

  it('builds a GithubClient exposing resolveToken and repoExists', function () {
    const client = defaultGithubClient();
    expect(client.resolveToken).to.be.a('function');
    expect(client.repoExists).to.be.a('function');
  });
});
