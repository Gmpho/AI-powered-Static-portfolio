import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from '../src/rateLimiter';

interface MockEnv {
	RATE_LIMIT_KV: {
		// Mock KVNamespace
		get: (key: string) => Promise<string | null>;
		put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
	};
}

describe('Rate Limiter', () => {
	let mockEnv: MockEnv;
	const IP_ADDRESS = '192.168.1.1';
	const WINDOW_SIZE_SECONDS = 60;
	const MAX_REQUESTS = 10;

	beforeEach(() => {
		vi.useFakeTimers(); // Mock timers for consistent testing
		const kvStore = new Map<string, string>();
		mockEnv = {
			RATE_LIMIT_KV: {
				get: vi.fn(async (key: string) => {
					const stored = kvStore.get(key);
					return stored ? JSON.parse(stored) : null;
				}),
				put: vi.fn(async (key: string, value: string, options?: { expirationTtl?: number }) => {
					kvStore.set(key, value);
					if (options?.expirationTtl) {
						setTimeout(() => kvStore.delete(key), options.expirationTtl * 1000);
					}
				}),
			},
		};
		vi.setSystemTime(new Date(2025, 0, 1, 12, 0, 0)); // Set a fixed time
	});

	it('should allow requests up to the limit', async () => {
		for (let i = 0; i < MAX_REQUESTS; i++) {
			const result = await checkRateLimit(IP_ADDRESS, mockEnv as any);
			expect(result.allowed).toBe(true);
			expect(result.retryAfter).toBeUndefined();
		}
		expect(mockEnv.RATE_LIMIT_KV.get).toHaveBeenCalledTimes(MAX_REQUESTS);
		expect(mockEnv.RATE_LIMIT_KV.put).toHaveBeenCalledTimes(MAX_REQUESTS);
	});

	it('should deny requests exceeding the limit', async () => {
		for (let i = 0; i < MAX_REQUESTS; i++) {
			await checkRateLimit(IP_ADDRESS, mockEnv as any);
		}
		const result = await checkRateLimit(IP_ADDRESS, mockEnv as any);
		expect(result.allowed).toBe(false);
		expect(result.retryAfter).toBeGreaterThan(0);
		expect(result.retryAfter).toBeLessThanOrEqual(WINDOW_SIZE_SECONDS);
	});

	it('should reset the limit after the window expires', async () => {
		// Exceed the limit
		for (let i = 0; i < MAX_REQUESTS; i++) {
			await checkRateLimit(IP_ADDRESS, mockEnv as any);
		}
		let result = await checkRateLimit(IP_ADDRESS, mockEnv as any);
		expect(result.allowed).toBe(false);

		// Advance time past the window
		vi.advanceTimersByTime(WINDOW_SIZE_SECONDS * 1000 + 1);

		// New request should be allowed
		result = await checkRateLimit(IP_ADDRESS, mockEnv as any);
		expect(result.allowed).toBe(true);
		expect(result.retryAfter).toBeUndefined();
	});

	it('should handle multiple IP addresses independently', async () => {
		const IP_ADDRESS_2 = '192.168.1.2';

		// IP1 exceeds limit
		for (let i = 0; i < MAX_REQUESTS; i++) {
			await checkRateLimit(IP_ADDRESS, mockEnv as any);
		}
		let result1 = await checkRateLimit(IP_ADDRESS, mockEnv as any);
		expect(result1.allowed).toBe(false);

		// IP2 should still be allowed
		let result2 = await checkRateLimit(IP_ADDRESS_2, mockEnv as any);
		expect(result2.allowed).toBe(true);
	});

	it('should return correct retryAfter for a partially filled window', async () => {
		// Send 5 requests
		for (let i = 0; i < 5; i++) {
			await checkRateLimit(IP_ADDRESS, mockEnv as any);
		}

		// Advance time by half the window
		vi.advanceTimersByTime((WINDOW_SIZE_SECONDS / 2) * 1000);

		// Send 5 more requests to hit the limit
		for (let i = 0; i < 5; i++) {
			await checkRateLimit(IP_ADDRESS, mockEnv as any);
		}

		// The next request should be denied with a retryAfter
		const result = await checkRateLimit(IP_ADDRESS, mockEnv as any);
		expect(result.allowed).toBe(false);
		// The first 5 requests would have expired after WINDOW_SIZE_SECONDS from their timestamp
		// The last 5 requests were sent at WINDOW_SIZE_SECONDS / 2
		// So retryAfter should be roughly WINDOW_SIZE_SECONDS / 2
		expect(result.retryAfter).toBeGreaterThan(0);
		expect(result.retryAfter).toBeLessThanOrEqual(WINDOW_SIZE_SECONDS / 2 + 1); // Allow for slight variance
	});
});
