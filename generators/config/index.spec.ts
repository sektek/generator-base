import { dirname, join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os, { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';
import sinon from 'sinon';

import { ConfigGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

describe('@sektek/base:config', function () {
  let homeDir: string;
  let homedirStub: sinon.SinonStub;

  beforeEach(function () {
    homeDir = mkdtempSync(join(tmpdir(), 'sektek-base-config-home-'));
    homedirStub = sinon.stub(os, 'homedir').returns(homeDir);
  });

  afterEach(function () {
    homedirStub.restore();
    rmSync(homeDir, { recursive: true, force: true });
  });

  it('generates using ConfigGenerator', async function () {
    const result = await helper.run(generator);
    expect(result.generator).to.be.instanceOf(ConfigGenerator);
  });

  it('defaults to gen.config.yaml at the destination root', async function () {
    const { fs } = await helper.run(generator);
    expect(fs.exists('gen.config.yaml')).to.be.true;
  });

  it('populates an explicitly-given option and comments out one that was not given', async function () {
    const { fs } = await helper.run(generator).withOptions({
      explicitOptionKeys: ['license'],
      license: 'MIT',
      author: 'Edward Kelly',
    });

    const content = fs.read('gen.config.yaml');
    expect(content).to.include('license: "MIT"');
    expect(content).to.include('# author: "Edward Kelly"');
  });

  it('treats every option key as explicit when explicitOptionKeys is omitted', async function () {
    const { fs } = await helper.run(generator).withOptions({
      license: 'MIT',
    });

    const content = fs.read('gen.config.yaml');
    expect(content).to.include('license: "MIT"');
  });

  it('does not populate or comment a key already supplied by a higher-up (home) config', async function () {
    writeFileSync(join(homeDir, 'gen.config.yaml'), 'author: Someone Else\n');

    const { fs } = await helper.run(generator).withOptions({
      explicitOptionKeys: [],
      author: undefined,
    });

    const content = fs.read('gen.config.yaml');
    expect(content).to.not.include('author');
  });

  it('still comments out a key not covered by any higher-up config', async function () {
    const { fs } = await helper.run(generator).withOptions({
      explicitOptionKeys: [],
      license: 'UNLICENSED',
    });

    const content = fs.read('gen.config.yaml');
    expect(content).to.include('# license: "UNLICENSED"');
  });

  it('merges into an existing gen.config.yaml: keeps an existing value and adds a new commented key', async function () {
    const { fs } = await helper
      .run(generator)
      .doInDir(dir => {
        writeFileSync(join(dir, 'gen.config.yaml'), 'author: "Existing"\n');
      })
      .withOptions({
        explicitOptionKeys: [],
        author: 'Should Not Overwrite',
        license: 'UNLICENSED',
      });

    const content = fs.read('gen.config.yaml');
    expect(content).to.include('author: "Existing"');
    expect(content).to.include('# license: "UNLICENSED"');
  });

  it('lets an explicit value this run override a stale existing value', async function () {
    const { fs } = await helper
      .run(generator)
      .doInDir(dir => {
        writeFileSync(join(dir, 'gen.config.yaml'), 'author: "Existing"\n');
      })
      .withOptions({
        explicitOptionKeys: ['author'],
        author: 'New Value',
      });

    const content = fs.read('gen.config.yaml');
    expect(content).to.include('author: "New Value"');
    expect(content).to.not.include('"Existing"');
  });

  it('honors an explicit configFile path/extension override', async function () {
    const { fs } = await helper.run(generator).withOptions({
      configFile: 'config/settings.json',
      explicitOptionKeys: ['license'],
      license: 'MIT',
    });

    expect(fs.exists('gen.config.yaml')).to.be.false;
    expect(fs.exists('config/settings.json')).to.be.true;
    expect(JSON.parse(fs.read('config/settings.json'))).to.deep.equal({
      license: 'MIT',
    });
  });

  it('skips commented placeholders entirely for a .json target (no comment syntax)', async function () {
    const { fs } = await helper.run(generator).withOptions({
      configFile: 'gen.config.json',
      explicitOptionKeys: [],
      license: 'UNLICENSED',
    });

    const content = fs.read('gen.config.json');
    expect(content).to.not.include('license');
    expect(JSON.parse(content)).to.deep.equal({});
  });

  it('rejects an unsupported --config-file extension', async function () {
    await helper
      .run(generator)
      .withOptions({ configFile: 'gen.config.toml' })
      .then(
        () => {
          throw new Error('expected the run to reject');
        },
        error => {
          expect((error as Error).message).to.include('gen.config.toml');
        },
      );
  });

  it('never writes internal/plumbing options (e.g. explicitOptionKeys itself) into the config file', async function () {
    const { fs } = await helper.run(generator).withOptions({
      explicitOptionKeys: ['license'],
      license: 'MIT',
    });

    const content = fs.read('gen.config.yaml');
    expect(content).to.not.include('explicitOptionKeys');
    expect(content).to.not.include('configFile');
  });

  it('never writes yeoman-generator/yeoman-environment-injected plumbing options into the config file', async function () {
    const { fs } = await helper.run(generator).withOptions({
      explicitOptionKeys: [],
      namespace: '@sektek/base:config',
      resolved: '/some/path/to/generators/config/index.js',
      sharedData: {},
      askAnswered: false,
      forceInstall: false,
      forwardErrorToEnvironment: false,
      initialGenerator: true,
      skipCache: false,
      skipLocalCache: true,
      skipParseOptions: false,
      localConfigOnly: false,
    });

    const content = fs.read('gen.config.yaml');
    for (const key of [
      'namespace',
      'resolved',
      'sharedData',
      'askAnswered',
      'forceInstall',
      'forwardErrorToEnvironment',
      'initialGenerator',
      'skipCache',
      'skipLocalCache',
      'skipParseOptions',
      'localConfigOnly',
    ]) {
      expect(content, `expected ${key} to be excluded`).to.not.include(key);
    }
  });
});
