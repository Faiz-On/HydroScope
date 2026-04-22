import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',

  plugins: [react()],

  publicDir: '../public',

  base: "./",

  server: {
    port: 3000,
    open: true
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false
  }
});