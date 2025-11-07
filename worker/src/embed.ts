import { checkRateLimit } from './rateLimiter';
import { Env } from './index'; // Import the comprehensive Env interface

const EMBEDDING_MODEL = 'embedding-001';
const MAX_TEXT_LENGTH = 1024; // Example max length for embedding input

export async function generateEmbedding(text: string, env: Env): Promise<number[]> {
	// G.E.M. NOTE (validation): Validate text length before sending to embedding model.
	if (!text || text.length === 0 || text.length > MAX_TEXT_LENGTH) {
		throw new Error(`Invalid text length for embedding. Must be between 1 and ${MAX_TEXT_LENGTH} characters.`);
	}

	const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

	const requestBody = {
		content: {
			parts: [{ text: text }],
		},
	};

	const response = await fetch(googleApiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-goog-api-key': env.GEMINI_API_KEY,
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Error from embedding service: ${errorText}`);
	}

	const data: { embedding: { values: number[] } } = await response.json(); // Type assertion
	// G.E.M. NOTE (validation): Ensure a deterministic vector shape is returned.
	const embedding = data.embedding.values;
	if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
		throw new Error('Invalid embedding format received from API.');
	}
	return embedding;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname !== '/embed') {
			return new Response('Not Found', { status: 404 });
		}

		if (request.method !== 'POST') {
			return new Response('Expected POST request', { status: 405 });
		}

		// G.E.M. NOTE (rate-limit): Apply server-side rate-limiting here.
		const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown'; // Cloudflare provides client IP
		const rateLimitResult = await checkRateLimit(clientIp, env); // Pass env and await

		if (!rateLimitResult.allowed) {
			return new Response('Too Many Requests', {
				status: 429,
				headers: {
					'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
				},
			});
		}

        // Authenticate the request
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || authHeader !== `Bearer ${env.EMBEDDING_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

		if (!env.GEMINI_API_KEY) {
			return new Response('Missing server configuration. Please check your .dev.vars file.', { status: 500 });
		}

		try {
			const requestBody: { text?: string } = await request.json();
			const textToEmbed = requestBody.text;

			if (!textToEmbed) {
				return new Response('Missing text in request body', { status: 400 });
			}

			// G.E.M. NOTE (security): This endpoint is intended for server-side use only.
			// No direct client calls should be allowed. Further authentication/authorization
			// might be needed if this endpoint is ever exposed beyond internal worker calls.
			// G.E.M. NOTE (throttle): Implement throttling for this endpoint to prevent abuse.

			const embedding = await generateEmbedding(textToEmbed, env);

			return new Response(JSON.stringify({ embedding }), {
				headers: { 'Content-Type': 'application/json' },
			});
		} catch (error) {
			console.error('Embedding worker error:', error);
			return new Response(`Internal Server Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;