import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => {
  return {
    root: __dirname,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabledd in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      
      allowedHosts: true,
      
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/prisma/**',
          '**/*.db',
          '**/*.db-*',
          '**/*.sqlite*',
          '**/*.json',
          '**/.backups/**',
          '**/.agents/**',
          '**/dist/**',
          '**/public/uploads/**',
          '**/.git/**',
          '**/node_modules/**'
        ]
      },
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
            if (id.includes('node_modules/motion')) return 'motion';
            if (id.includes('node_modules/firebase')) return 'firebase';
            if (id.includes('node_modules/lucide-react')) return 'lucide';
          }
        }
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
