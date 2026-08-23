import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

import { expect } from 'chai';

import { GENERATORS } from './manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('manifest', function () {
  it('lists exactly the sub-generator directories under generators/', function () {
    const actual = readdirSync(join(__dirname, 'generators'), {
      withFileTypes: true,
    })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();

    expect([...GENERATORS].sort()).to.deep.equal(actual);
  });
});
