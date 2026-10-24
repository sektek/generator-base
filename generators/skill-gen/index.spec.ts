import { dirname, join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';
import { parse } from 'yaml';

import { SkillGenGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');
const skills = join(__dirname, '../skills/index.js');

const frontmatterOf = (content: string) =>
  parse(content.split('---\n')[1]) as Record<string, string>;

describe('@sektek/base:skill-gen', function () {
  let originalHome: string | undefined;

  beforeEach(function () {
    originalHome = process.env.HOME;
    process.env.HOME = mkdtempSync(join(tmpdir(), 'skill-gen-home-'));
  });

  afterEach(function () {
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
  });

  it('generates using SkillGenGenerator', async function () {
    const result = await helper.run(generator);
    expect(result.generator).to.be.instanceOf(SkillGenGenerator);
  });

  it('writes the gen skill into the project by default', async function () {
    const { fs } = await helper.run(generator);

    const content = fs.read('.claude/skills/gen/SKILL.md');
    const { name, description } = frontmatterOf(content);
    expect(name).to.equal('gen');
    expect(description).to.be.a('string').that.is.not.empty;
  });

  it('writes the gen skill under the home directory for user scope', async function () {
    const { fs } = await helper.run(generator).withOptions({ scope: 'user' });

    expect(fs.exists('.claude/skills/gen/SKILL.md')).to.be.false;
    expect(fs.exists(join(homedir(), '.claude/skills/gen/SKILL.md'))).to.be
      .true;
  });

  it('is installed by base:skills when asked for', async function () {
    const { fs } = await helper
      .run(skills)
      .withGenerators([[generator, { namespace: '@sektek/base:skill-gen' }]])
      .withOptions({ skills: ['gen'] });

    expect(frontmatterOf(fs.read('.claude/skills/gen/SKILL.md')).name).to.equal(
      'gen',
    );
  });

  it('is not installed by base:skills when another skill is asked for', async function () {
    let error: Error | undefined;
    try {
      await helper
        .run(skills)
        .withGenerators([[generator, { namespace: '@sektek/base:skill-gen' }]])
        .withOptions({ skills: ['other'] });
    } catch (e) {
      error = e as Error;
    }

    expect(error?.message).to.equal('Unknown skill: other. Valid skills: gen');
  });
});
