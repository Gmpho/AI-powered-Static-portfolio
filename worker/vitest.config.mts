import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          kvNamespaces: ['RATE_LIMIT_KV', 'PROJECT_EMBEDDINGS_KV'], // Explicitly define KV namespaces
          bindings: {
            ENVIRONMENT: 'test',
          },
        },
        singleWorker: true, // Experiment with reusing worker instance
      },
    },
    testTimeout: 120000, // 120 seconds
  },
});
