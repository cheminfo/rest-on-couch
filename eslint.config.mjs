import { config, globals } from 'eslint-config-zakodium';
import js from 'eslint-config-zakodium/js';
import react from 'eslint-config-zakodium/react';

export default config(
  {
    ignores: [
      'public',
      'test/homeDirectories/**',
      'src/design/*',
      'coverage',
      'dist',
    ],
  },
  ...js,
  {
    rules: {
      camelcase: ['error', { properties: 'never' }],
      'callback-return': 'off',
      'no-await-in-loop': 'off',
      'no-var': 'off',
      'prefer-named-capture-group': 'off',
      'import/no-dynamic-require': 'off',
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
      globals: {
        ...globals.jest,
        couch: true,
      },
    },
  },
  {
    files: ['src/client/**/*'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['src/client/**/*.jsx'],
    extends: [...react],
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
    },
  },
);
