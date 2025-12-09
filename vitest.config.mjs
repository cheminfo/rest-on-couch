import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig({
  test: {
    restoreMocks: true,
    env: loadEnv('test', process.cwd(), ''),
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
