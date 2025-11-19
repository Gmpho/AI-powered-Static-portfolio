import { defineConfig } from "vite";
import { resolve } from 'path';
import { cloudflare } from '@cloudflare/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  // Set base dynamically: '/' for development, '/AI-powered-Static-portfolio/' for build (e.g., GitHub Pages)
  const base = isProduction ? '/AI-powered-Static-portfolio/' : '/';

  return {
    root: "./frontend", // Set the root to the frontend directory
    base: base, // Use the dynamically set base path
    build: {
      outDir: "../dist", // Output to a `dist` folder in the project root
      emptyOutDir: true, // Clean the output directory before building
      sourcemap: false, // Do not generate source maps for production
    },
    resolve: {
      alias: {
        // Create an absolute path to the dependency from the project root
        'dompurify': resolve(__dirname, 'node_modules/dompurify/dist/purify.js'),
        // Add alias for src directory
        '@': resolve(__dirname, 'frontend/src'),
      },
    },
    server: {

      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..']
      },

    },
  };
});
