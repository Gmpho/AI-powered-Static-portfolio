import { defineConfig } from "vite";
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: "./frontend", // Set the root to the frontend directory
  base: "/AI-powered-Static-portfolio/", // Required for GitHub Pages deployment
  build: {
    outDir: "../dist", // Output to a `dist` folder in the project root
    emptyOutDir: true, // Clean the output directory before building
    sourcemap: false, // Do not generate source maps for production
  },
  resolve: {
    alias: {
      // Create an absolute path to the dependency from the project root
      'dompurify': resolve(__dirname, 'node_modules/dompurify/dist/purify.js'),
    },
  },
});
