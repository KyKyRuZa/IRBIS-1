import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const proxyTarget = process.env.VITE_API_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@styles': path.resolve(import.meta.dirname, './src/styles'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@pages': path.resolve(import.meta.dirname, './src/pages'),
      '@hooks': path.resolve(import.meta.dirname, './src/hooks'),
      '@lib': path.resolve(import.meta.dirname, './src/lib'),
      '@contexts': path.resolve(import.meta.dirname, './src/contexts'),
      '@features': path.resolve(import.meta.dirname, './src/features'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/certs': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
});