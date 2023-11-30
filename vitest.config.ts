import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      enabled: true,
    },
    include: ['src/**/*.spec.*'],
    globalSetup: './test-globals.ts',
  },
});
