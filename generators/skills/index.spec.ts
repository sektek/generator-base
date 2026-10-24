import { Composite } from '@sektek/generator';
import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { BaseSkillGenerator } from '../../lib/skills/base-skill-generator.js';
import { scopePrompt } from '../../lib/skills/skill-scope.js';

import { SkillsGenerator } from './index.js';

class AlphaSkillGenerator extends BaseSkillGenerator {
  skill = { name: 'alpha', description: 'Alpha', template: 'unused' };

  taskWriting() {
    this.fs.write(this.destinationPath('alpha-ran'), 'yes');
  }
}

class BetaSkillGenerator extends BaseSkillGenerator {
  skill = { name: 'beta', description: 'Beta', template: 'unused' };

  taskWriting() {
    this.fs.write(this.destinationPath('beta-ran'), 'yes');
  }
}

class TestSkillsGenerator extends SkillsGenerator {
  // Yeoman only calls beforeQueue when it is on the instance's own prototype.
  async beforeQueue() {
    await super.beforeQueue();
  }

  static composites(): Composite[] {
    return [
      { name: '@sektek/base:skill-alpha', generatorClass: AlphaSkillGenerator },
      { name: '@sektek/base:skill-beta', generatorClass: BetaSkillGenerator },
    ];
  }
}

const run = (generator: typeof SkillsGenerator = TestSkillsGenerator) =>
  helper.run(generator).withGenerators([
    [AlphaSkillGenerator, { namespace: '@sektek/base:skill-alpha' }],
    [BetaSkillGenerator, { namespace: '@sektek/base:skill-beta' }],
  ]);

describe('@sektek/base:skills', function () {
  it('is in place', function () {
    expect(SkillsGenerator.destinationMode()).to.deep.equal({
      kind: 'inPlace',
    });
  });

  describe('prompts()', function () {
    it('asks for skills and the shared scope, once', function () {
      const prompts = TestSkillsGenerator.prompts();

      expect(prompts.map(p => p.name)).to.include.members(['skills', 'scope']);
      expect(prompts).to.include(scopePrompt);
    });

    it('defaults skills to every composed skill', async function () {
      const skills = TestSkillsGenerator.prompts().find(
        p => p.name === 'skills',
      );

      expect(await (skills?.provider as () => unknown)()).to.deep.equal([
        'alpha',
        'beta',
      ]);
    });
  });

  it('installs every skill when none are named', async function () {
    const { fs } = await run();

    expect(fs.exists('alpha-ran')).to.be.true;
    expect(fs.exists('beta-ran')).to.be.true;
  });

  it('installs only the named skills', async function () {
    const { fs } = await run().withOptions({ skills: ['beta'] });

    expect(fs.exists('alpha-ran')).to.be.false;
    expect(fs.exists('beta-ran')).to.be.true;
  });

  it('rejects an unknown skill, naming the valid ones', async function () {
    let error: Error | undefined;
    try {
      await run().withOptions({ skills: ['alpha', 'nope'] });
    } catch (e) {
      error = e as Error;
    }

    expect(error?.message).to.equal(
      'Unknown skill: nope. Valid skills: alpha, beta',
    );
  });

  it('writes nothing when no skill generators exist', async function () {
    const { fs } = await run(SkillsGenerator);

    expect(Object.keys(fs.dump())).to.deep.equal([]);
  });
});
