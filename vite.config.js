import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so GitHub Pages subpath deploys work without config
  base: './',
  plugins: [react()],
  server: { port: 5173, open: true },
});
