import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Custom plugin to copy assets from public to dist
const copyAssetsPlugin = () => ({
  name: 'copy-assets',
  apply: 'build',
  writeBundle() {
    const sourceDir = path.resolve(__dirname, 'public/assets');
    const destDir = path.resolve(__dirname, 'dist/assets');
    
    if (fs.existsSync(sourceDir)) {
      const files = fs.readdirSync(sourceDir);
      files.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
        
        // Only copy non-JS/CSS files
        if (!file.endsWith('.js') && !file.endsWith('.css')) {
          fs.copyFileSync(sourcePath, destPath);
        }
      });
    }
  }
});

export default defineConfig({
  root: 'src',
  plugins: [react(), copyAssetsPlugin()],
  publicDir: '../public',
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
