import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Keep built assets relative so the app can live at a domain root or subpath.
  base: './',
  plugins: [react()],
});
