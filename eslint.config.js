import { defineConfig } from 'eslint/config';
import sektek from '@sektek/eslint-plugin';

export default defineConfig([
  sektek.configs.typescript,
  {
    rules: {
      // Import blocks, top to bottom: Node built-ins, then dependencies
      // (external packages and local workspace packages alike), then
      // local (relative) files — a blank line between each block.
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            ['external', 'internal'],
            ['parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
]);
