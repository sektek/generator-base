import { homedir, tmpdir } from 'node:os';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import {
  BaseSkillGenerator,
  SkillDefinition,
  SkillOptions,
} from './base-skill-generator.js';
import { scopePrompt } from './skill-scope.js';

const templates = mkdtempSync(join(tmpdir(), 'skill-templates-'));
writeFileSync(
  join(templates, 'fake.md.ejs'),
  '---\nname: <%= name %>\ndescription: <%= description %>\n---\nBody\n',
);

class FakeSkillGenerator extends BaseSkillGenerator {
  skill: SkillDefinition = {
    name: 'fake',
    description: 'A fake skill',
    template: 'fake.md.ejs',
  };

  constructor(args: string[], options: SkillOptions) {
    super(args, options);
    this.sourceRoot(templates);
  }
}

const run = () =>
  helper.run(FakeSkillGenerator, { namespace: '@sektek/base:skill-fake' });

describe('BaseSkillGenerator', function () {
  it('declares the shared scope prompt', function () {
    expect(FakeSkillGenerator.prompts()).to.deep.equal([scopePrompt]);
  });

  it('is in place', function () {
    expect(FakeSkillGenerator.destinationMode()).to.deep.equal({
      kind: 'inPlace',
    });
  });

  it('writes the rendered skill under .claude/skills in the project by default', async function () {
    const { fs } = await run();

    expect(fs.read('.claude/skills/fake/SKILL.md')).to.equal(
      '---\nname: fake\ndescription: A fake skill\n---\nBody\n',
    );
  });

  describe('with user scope', function () {
    let home: string;
    let originalHome: string | undefined;

    beforeEach(function () {
      home = mkdtempSync(join(tmpdir(), 'skill-home-'));
      originalHome = process.env.HOME;
      process.env.HOME = home;
      mkdirSync(home, { recursive: true });
    });

    afterEach(function () {
      if (originalHome === undefined) delete process.env.HOME;
      else process.env.HOME = originalHome;
    });

    it('writes under the home directory and not the destination', async function () {
      expect(homedir()).to.equal(home);

      const { fs } = await run().withOptions({ scope: 'user' });

      expect(fs.exists('.claude/skills/fake/SKILL.md')).to.be.false;
      expect(fs.exists(join(home, '.claude', 'skills', 'fake', 'SKILL.md'))).to
        .be.true;
    });
  });
});
