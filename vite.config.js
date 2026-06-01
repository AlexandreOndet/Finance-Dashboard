import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps asset URLs relative so the build works from any GitHub Pages
// path (https://user.github.io/<repo>/) without knowing the repo name.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
