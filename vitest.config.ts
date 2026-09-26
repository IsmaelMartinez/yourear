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
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/screens/**', 'src/test/**', '**/*.d.ts', '**/*.test.ts'],
      // A ratchet at the measured baseline, rounded down: raise it as coverage grows, never lower it
      thresholds: {
        statements: 98,
        branches: 91,
        functions: 96,
        lines: 98,
      },
    },
  },
});
