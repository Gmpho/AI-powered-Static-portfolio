import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from './rateLimiter';
import { sanitizeOutput, checkInjection } from './guardrails'; // Import checkInjection

interface Project {
	title: string;
	summary: string;
	description: string;
	tags: string[];
	url: string;
}

interface Env {
	GEMINI_API_KEY: string;
	ALLOWED_ORIGINS?: string;
	RATE_LIMIT_KV: KVNamespace;
}

interface ContactFormRequest {
	name: string;
	email: string;
	message: string;
}

interface ChatRequest {
	prompt?: string;
	persona?: string;
	projects?: Project[];
}

interface EmbeddingRequest {
	text: string;
}

// Helper to create a structured JSON response
const jsonResponse = (data: object, status: number, headers: HeadersInit = {}) => {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers },
	});
};

const createErrorResponse = (message: string, status: number, corsHeaders: HeadersInit = {}) => {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders },
	});
};

async function validateGeminiKey(apiKey: string): Promise<boolean> {
	try {
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1' });
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
			corsHeaders['Access-Control-Max-Age'] = '86400'; // Cache preflight requests for 24 hours
		} else if (origin && !allowedOrigins.includes(origin)) {
			// Explicitly block requests from disallowed origins
			return createErrorResponse('Forbidden', 403, corsHeaders);
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
			return createErrorResponse('Too Many Requests', 429, {
				'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
				...corsHeaders,
			});
		}

		if (url.pathname === '/contact') {
			if (request.method !== 'POST') {
				return createErrorResponse('Method Not Allowed', 405, corsHeaders);
			}

			try {
				const requestBody: ContactFormRequest = await request.json();
				const { name, email, message } = requestBody;

				if (!name || !email || !message) {
					return createErrorResponse('Missing required fields (name, email, message)', 400, corsHeaders);
				}

				// In a real application, you would integrate with an email sending service here.
				// For this example, we'll just simulate a successful send.
				console.log(`Received contact form submission:\nName: ${name}\nEmail: ${email}\nMessage: ${message}`);

				// Simulate a delay for sending email
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Simulate success
				return jsonResponse({ status: 'sent' }, 200, corsHeaders);
			} catch (error) {
				console.error('Error processing contact form submission:', error);
				return createErrorResponse('Sorry, I’m having trouble answering that right now.', 500, corsHeaders);
			}
		}

		if (url.pathname === '/api/generateEmbedding') {
			if (request.method !== 'POST') {
				return createErrorResponse('Method Not Allowed', 405, corsHeaders);
			}

			if (!env.GEMINI_API_KEY) {
				console.error('GEMINI_API_KEY is not set.');
				return createErrorResponse('Missing server configuration', 500, corsHeaders);
			}

			try {
				const requestBody: EmbeddingRequest = await request.json();
				const { text } = requestBody;

				if (!text || typeof text !== 'string' || text.trim().length === 0) {
					return createErrorResponse('Invalid text in request body', 400, corsHeaders);
				}

				// Apply guardrails to the incoming text
				if (checkInjection(text)) {
					return createErrorResponse('Sensitive content detected in text.', 400, corsHeaders);
				}

				const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
				const model = genAI.getGenerativeModel({ model: 'embedding-001' }); // Use the embedding model

				const result = await model.embedContent(text);
				const embedding = result.embedding.values;

				return jsonResponse({ embedding }, 200, corsHeaders);
			} catch (error) {
				console.error('Error generating embedding:', error);
				return createErrorResponse('Sorry, I’m having trouble generating the embedding right now.', 500, corsHeaders);
			}
		}

		if (url.pathname !== '/chat') {
			return createErrorResponse('Not Found', 404, corsHeaders);
		}

		if (request.method !== 'POST') {
			return createErrorResponse('Method Not Allowed', 405, corsHeaders);
		}

		if (!env.GEMINI_API_KEY) {
			console.error('GEMINI_API_KEY is not set.');

			return createErrorResponse('Missing server configuration', 500, corsHeaders);
		}

		try {
			const requestBody: ChatRequest = await request.json();
			const { prompt, persona, projects } = requestBody;

			// Apply guardrails to the incoming prompt
			if (prompt && checkInjection(prompt)) {
				return createErrorResponse('Sensitive content detected in prompt.', 400, corsHeaders);
			}

			const systemPrompt = `You are AG Gift, an innovative, witty, and insightful AI assistant, built by Gift, and passionately dedicated to showcasing the projects in this portfolio. Your mission is to engage visitors with descriptive and enthusiastic explanations, making technical topics accessible and exciting, and to introduce them to G.E.M services.

When discussing projects, ONLY use the provided project data below. DO NOT invent details or information not explicitly present. If a question is outside the scope of the portfolio projects, or if you cannot find relevant information within the provided data, politely state that you can only discuss the portfolio projects.

Present project information in an engaging and descriptive manner, highlighting key features, technologies, and the impact of the work. Keep responses concise (<= 3 short paragraphs) unless the user asks for more detail.

--- Available Projects ---
${projects ? projects.map(p => `Title: ${p.title}\nSummary: ${p.summary}\nDescription: ${p.description}\nTags: ${p.tags.join(', ')}\nURL: ${p.url}`).join('\n\n') : 'No project data available.'}
--- End Available Projects ---
`;

			if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
				return createErrorResponse('Invalid prompt in request body', 400, corsHeaders);
			}

			// Use the Google Generative AI SDK
			const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
			const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

			// Combine the trusted system prompt with the user prompt into a single input string
			const combinedPrompt = `${systemPrompt}\n\nUser: ${prompt}`;

			const result = await model.generateContent(combinedPrompt);
			const response = result.response;
			const text = response.text();

			return jsonResponse({ response: sanitizeOutput(text) }, 200, corsHeaders); // Sanitize output here
		} catch (error) {
			console.error('Error processing chat request:', error);
			return createErrorResponse('Sorry, I’m having trouble answering that right now.', 503, corsHeaders);
		}
	},
} satisfies ExportedHandler<Env>;
