import { defineConfig } from 'vite';

export default defineConfig({
  base: '/yourear/', // GitHub Pages base path
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
});
