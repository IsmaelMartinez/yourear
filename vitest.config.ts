import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    globals: true,
    include: ['src/**/*.test.ts'],
    // Undo every vi.stubGlobal (see src/test/web-audio.ts) after each test
    unstubGlobals: true,
  },
});
