import { expect } from 'chai';

import { addRemote, push } from './remote.js';
import { createRepo, getAuthenticatedUser } from './api.js';
import { defaultGithubClient } from './client.js';
import { resolveToken } from './token.js';

describe('lib/github/client', function () {
  describe('defaultGithubClient', function () {
    it('wires up the real implementations of every method', function () {
      const client = defaultGithubClient();

      expect(client.resolveToken).to.equal(resolveToken);
      expect(client.getAuthenticatedUser).to.equal(getAuthenticatedUser);
      expect(client.createRepo).to.equal(createRepo);
      expect(client.addRemote).to.equal(addRemote);
      expect(client.push).to.equal(push);
    });
  });
});
