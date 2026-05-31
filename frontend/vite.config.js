import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': { target: 'http://localhost:4020', changeOrigin: true, timeout: 600000, proxyTimeout: 600000 },
      '/out': { target: 'http://localhost:4020', changeOrigin: true },
      '/uploads': { target: 'http://localhost:4020', changeOrigin: true },
    },
  },
});
