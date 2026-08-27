import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules/**'],
    setupFiles: ['./tests/setup.js'],
    // The suite shares one isolated database; running files in parallel would
    // race on the per-test truncation in `resetDatabase`, so serialize them.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
