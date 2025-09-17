import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['test/setup/setup.js'],
    testTimeout: 20_000,
    // The same database may be used by multiple tests.
    // We would need to use unique database names to enable this.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/client/**'],
    },
  },
});
