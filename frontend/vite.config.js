import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const bePort = process.env.VITE_BE_PORT || 4000;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${bePort}`,
        changeOrigin: true,
      },
    },
  },
});
