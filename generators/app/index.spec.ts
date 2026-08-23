import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { AppGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

// AppGenerator composes its sub-generators by the namespace @sektek/base
// rewrites them to (see CoreGenerator#composeWith). The shared test helper
// has nothing registered under those namespaces by default, so each
// sub-generator must be registered by path (so its templates/ dir still
// resolves) under the namespace app will compose it as.
const run = () =>
  helper.run(generator).withGenerators([
    [
      join(__dirname, '../editorconfig/index.js'),
      { namespace: '@sektek/base:editorconfig' },
    ],
    [
      join(__dirname, '../gitconfig/index.js'),
      { namespace: '@sektek/base:gitconfig' },
    ],
    [
      join(__dirname, '../readme/index.js'),
      { namespace: '@sektek/base:readme' },
    ],
    [
      join(__dirname, '../devcontainer/index.js'),
      { namespace: '@sektek/base:devcontainer' },
    ],
  ]);

describe('@sektek/base:app', function () {
  it('generates using AppGenerator', async function () {
    const result = await run();
    expect(result.generator).to.be.instanceOf(AppGenerator);
  });

  it('composes the editorconfig generator', async function () {
    const { fs } = await run();
    expect(fs.exists('.editorconfig')).to.be.true;
  });

  it('composes the gitconfig generator', async function () {
    const { fs } = await run();
    expect(fs.exists('.gitignore')).to.be.true;
    expect(fs.exists('.gitattributes')).to.be.true;
  });

  it('composes the readme generator', async function () {
    const { fs } = await run();
    expect(fs.exists('README.md')).to.be.true;
  });

  it('composes the devcontainer generator with the default profile', async function () {
    const { fs } = await run();
    expect(fs.exists('.devcontainer/devcontainer.json')).to.be.true;
    expect(fs.exists('.devcontainer/Dockerfile')).to.be.true;
    expect(fs.exists('.devcontainer/docker-compose.yml')).to.be.false;
  });
});
