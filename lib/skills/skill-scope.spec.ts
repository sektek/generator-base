import { homedir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'chai';

import { scopePrompt, skillsDirectory } from './skill-scope.js';

describe('skill scope', function () {
  describe('skillsDirectory', function () {
    it('roots the project scope at the destination', function () {
      expect(skillsDirectory('claude', 'project', '/work/app')).to.equal(
        join('/work/app', '.claude', 'skills'),
      );
    });

    it('roots the user scope at the home directory, ignoring the destination', function () {
      expect(skillsDirectory('claude', 'user', '/work/app')).to.equal(
        join(homedir(), '.claude', 'skills'),
      );
    });
  });

  describe('scopePrompt', function () {
    it('offers project and user, defaulting to project', async function () {
      expect(scopePrompt.name).to.equal('scope');
      expect(scopePrompt.type).to.equal('select');
      expect(scopePrompt.choices).to.deep.equal(['project', 'user']);
      expect(await (scopePrompt.provider as () => unknown)()).to.equal(
        'project',
      );
    });
  });
});
