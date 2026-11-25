import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Copy static /assets directory into dist/assets during production build
 * so existing /assets/images/... and /assets/icons/... URLs work seamlessly.
 */
function copyAssetsPlugin() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const srcDir = resolve(process.cwd(), 'assets');
      const destDir = resolve(process.cwd(), 'dist', 'assets');
      if (existsSync(srcDir)) {
        cpSync(srcDir, destDir, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyAssetsPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});

