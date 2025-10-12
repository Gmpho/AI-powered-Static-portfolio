import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.toml' },
				miniflare: {
					kvNamespaces: ['RATE_LIMIT_KV', 'RESUME_KV', 'SYSTEM_PROMPT_KV'],
				},
			},
		},
	},
});
