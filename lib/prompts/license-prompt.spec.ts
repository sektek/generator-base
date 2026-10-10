import { expect } from 'chai';

import { licensePrompt } from './license-prompt.js';

describe('licensePrompt', function () {
  it('declares a text prompt named license', function () {
    expect(licensePrompt.name).to.equal('license');
    expect(licensePrompt.type).to.equal('text');
    expect(licensePrompt.label).to.equal('License');
  });

  it('defaults to UNLICENSED', async function () {
    const { provider } = licensePrompt;
    expect(provider).to.be.a('function');
    const resolve = provider as () => Promise<string> | string;
    expect(await resolve()).to.equal('UNLICENSED');
  });
});
