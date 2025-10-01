import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from './rateLimiter';

interface Env {
	GEMINI_API_KEY: string;
	ALLOWED_ORIGINS?: string;
	RATE_LIMIT_KV: KVNamespace;
}

// Persona definitions (trusted server-side prompts)
const PERSONAS: Record<string, string> = {
	default: `You are AG Gift, a witty and helpful AI assistant. Be friendly, clear, and helpful. When answering, reference projects from the portfolio when relevant. Keep responses concise (<= 3 short paragraphs) unless the user asks for more detail.`,
	professional: `You are a professional and concise assistant. Provide clear, accurate answers in a formal tone. Prioritize correctness and brevity.`,
	playful: `You are playful and light-hearted. Use friendly metaphors and small humor, but remain accurate and helpful.`,
};

// Helper to create a structured JSON response
const jsonResponse = (data: object, status: number, headers: HeadersInit = {}) => {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers },
	});
};

async function validateGeminiKey(apiKey: string): Promise<boolean> {
	try {
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiVersion: 'v1' });
		// A simple, low-cost prompt to validate the key
		await model.generateContent('ping');
		return true;
	} catch (error) {
		console.error('Gemini API key validation failed:', error);
		return false;
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const origin = request.headers.get('Origin') || '';
		const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');

		const corsHeaders: HeadersInit = {};
		if (allowedOrigins.includes(origin)) {
			corsHeaders['Access-Control-Allow-Origin'] = origin;
			corsHeaders['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
			corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type';
		}

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);

		if (url.pathname === '/') {
			const htmlResponse = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>API Status</title>
                    <style>
                        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }\n                        .container { text-align: center; padding: 2rem; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n                        h1 { color: #1c1e21; }\n                        p { color: #606770; }\n                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>✅ API Worker is Running</h1>
                        <p>This is the backend API for the AI Portfolio. It only responds to POST requests at the /chat endpoint.</p>
                    </div>
                </body>
                </html>
            `;
			return new Response(htmlResponse, {
				status: 200,
				headers: { 'Content-Type': 'text/html', ...corsHeaders },
			});
		}

		if (url.pathname === '/health') {
			const geminiKeyValid = await validateGeminiKey(env.GEMINI_API_KEY);
			const kvStatus = env.RATE_LIMIT_KV ? 'connected' : 'disconnected';
			return jsonResponse(
				{
					status: 'ok',
					geminiKey: geminiKeyValid ? 'valid' : 'invalid',
					kvStatus: kvStatus,
				},
				200,
				corsHeaders,
			);
		}

		// Apply server-side rate-limiting
		const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
		const rateLimitResult = await checkRateLimit(clientIp, env);

		if (!rateLimitResult.allowed) {
			return jsonResponse({ error: 'Too Many Requests' }, 429, {
				'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
				...corsHeaders,
			});
		}

		if (url.pathname !== '/chat') {
			return jsonResponse({ error: 'Not Found' }, 404, corsHeaders);
		}

		if (request.method !== 'POST') {
			return jsonResponse({ error: 'Method Not Allowed' }, 405, corsHeaders);
		}

		if (!env.GEMINI_API_KEY) {
			console.error('GEMINI_API_KEY is not set.');
			return jsonResponse({ error: 'Missing server configuration' }, 500, corsHeaders);
		}

		try {
			const requestBody: { prompt?: string; persona?: string } = await request.json();
			const prompt = requestBody.prompt;
			const personaKey = requestBody.persona || 'default';

			const systemPrompt = PERSONAS[personaKey] ?? PERSONAS['default'];

			if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
				return jsonResponse({ error: 'Invalid prompt in request body' }, 400, corsHeaders);
			}

			// Use the Google Generative AI SDK
			const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
			const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

			// Combine the trusted system prompt with the user prompt into a single input string
			const combinedPrompt = `${systemPrompt}\n\nUser: ${prompt}`;

			const result = await model.generateContent(combinedPrompt);
			const response = result.response;
			const text = response.text();

			return jsonResponse({ response: text }, 200, corsHeaders);
		} catch (error) {
			console.error('Error processing chat request:', error);
			return jsonResponse({ error: 'Sorry, I’m having trouble answering that right now.' }, 503, corsHeaders);
		}
	},
} satisfies ExportedHandler<Env>;
