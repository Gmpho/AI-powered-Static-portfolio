import { Env } from './index';
const RATE_LIMIT_WINDOW_SECONDS = 60; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per IP

/**
 * Checks if a given IP address has exceeded the rate limit.
 *
 * IMPORTANT SECURITY NOTE:
 * This rate limiting implementation is based on client IP addresses. While it provides
 * a basic layer of protection, IP-based rate limiting can be bypassed by sophisticated
 * attackers using techniques like IP spoofing, botnets, or proxy services.
 *
 * For more robust rate limiting, consider implementing a scheme based on:
 * 1. Authenticated user IDs.
 * 2. Unique device identifiers.
 * 3. More advanced behavioral analysis.
 *
 * This function uses Cloudflare's KV store to track request timestamps for each IP.
 * It is designed to be called from a Cloudflare Worker.
 *
 * @param ip The client's IP address.
 * @param env The worker's environment, containing the KV namespace binding.
 * @returns A promise that resolves to an object indicating if the request is allowed.
 *          If not allowed, it includes a `retryAfter` value in seconds.
 */
export async function checkRateLimit(ip: string, env: Env): Promise<{ allowed: boolean; retryAfter?: number }> {
	// Bypass rate limiting entirely if in test environment
	if (process.env.NODE_ENV === 'test') {
		console.log('Rate limiting bypassed for test environment.');
		return { allowed: true };
	}

	        if (!env.RATE_LIMIT_KV) {
	               console.warn('RATE_LIMIT_KV namespace not found. Rate limiting is disabled.');
	               return { allowed: true };
	        }
	const now = Date.now();
	const windowStart = now - RATE_LIMIT_WINDOW_SECONDS * 1000;

	// Get the list of previous request timestamps for this IP.
	const timestamps: number[] = (await env.RATE_LIMIT_KV.get(ip, { type: 'json' })) || [];

	// Filter out timestamps that are outside the current window.
	const recentTimestamps = timestamps.filter((t) => t > windowStart);

	if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
		const oldestTimestamp = recentTimestamps[0];
		const retryAfter = Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW_SECONDS * 1000 - now) / 1000);
		return { allowed: false, retryAfter };
	}

	// Add the current timestamp and store it back in KV.
	recentTimestamps.push(now);
	// The `expirationTtl` ensures that KV keys for inactive IPs are automatically cleaned up.
	await env.RATE_LIMIT_KV.put(ip, JSON.stringify(recentTimestamps), {
		expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
	});

	return { allowed: true };
}
