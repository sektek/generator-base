import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { WorkspaceGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

const run = () =>
  helper.run(generator).withGenerators([
    [
      join(__dirname, '../devcontainer/index.js'),
      { namespace: '@sektek/base:devcontainer' },
    ],
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
  ]);

describe('@sektek/base:workspace', function () {
  it('generates using WorkspaceGenerator', async function () {
    const result = await run();
    expect(result.generator).to.be.instanceOf(WorkspaceGenerator);
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

  it('composes readme and appends the Changes Required checklist after it', async function () {
    const { fs } = await run();
    expect(fs.exists('README.md')).to.be.true;
    const readme = fs.read('README.md');
    expect(readme).to.include('## Changes Required');
    expect(readme.indexOf('#')).to.be.lessThan(
      readme.indexOf('## Changes Required'),
    );
  });

  it('composes the devcontainer generator with the workspace profile', async function () {
    const { fs } = await run();
    expect(fs.exists('.devcontainer/devcontainer.json')).to.be.true;
    expect(fs.read('.devcontainer/devcontainer.json')).to.include(
      'dockerComposeFile',
    );
    expect(fs.exists('.devcontainer/docker-compose.yml')).to.be.true;
    expect(fs.exists('.devcontainer/Dockerfile')).to.be.true;
  });

  it('generates .vscode/settings.json and .vscode/launch.json', async function () {
    const { fs } = await run();
    expect(fs.exists('.vscode/settings.json')).to.be.true;
    expect(fs.exists('.vscode/launch.json')).to.be.true;
  });
});
