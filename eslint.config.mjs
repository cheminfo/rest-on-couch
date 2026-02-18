import { defineConfig, globalIgnores } from 'eslint/config';
import { globals } from 'eslint-config-zakodium';
import ts from 'eslint-config-zakodium/ts';
import react from 'eslint-config-zakodium/react';

export default defineConfig(
  globalIgnores([
    'public',
    'test/homeDirectories/**',
    'src/design/*',
    'coverage',
    'dist',
  ]),
  ts,
  {
    rules: {
      camelcase: ['error', { properties: 'never' }],
      'callback-return': 'off',
      'no-await-in-loop': 'off',
      'no-var': 'off',
      'prefer-named-capture-group': 'off',
      'import/no-dynamic-require': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        // So the deep package.json files (used to specify the module format) are not taken into account.
        { packageDir: import.meta.dirname },
      ],
      'import/order': 'off',
    },
  },
  {
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['test/**'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        couch: true,
      },
    },
  },
  {
    files: ['src/client/**'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    extends: [react],
  },
  {
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
    },
  },
);
