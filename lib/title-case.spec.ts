import { expect } from 'chai';

import { titleCase } from './title-case.js';

describe('titleCase', function () {
  it('capitalizes each hyphen-separated word', function () {
    expect(titleCase('my-cool-project')).to.equal('My Cool Project');
  });

  it('capitalizes a single-word slug', function () {
    expect(titleCase('project')).to.equal('Project');
  });

  it('ignores empty segments from a leading/trailing/doubled hyphen', function () {
    expect(titleCase('-my--project-')).to.equal('My Project');
  });
});
