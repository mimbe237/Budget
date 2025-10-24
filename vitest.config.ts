import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**', '**/playwright/**'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
