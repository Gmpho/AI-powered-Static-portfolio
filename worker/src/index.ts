import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { checkRateLimit } from './rateLimiter';
import { checkGuardrails } from './guardrails'; // Import checkGuardrails
import { ContactFormSchema, GenerateEmbeddingRequestSchema } from './schemas';
import { handleChat } from './chat'; // Import handleChat
import { handleResumeRequest } from './resume'; // Import handleResumeRequest

interface Project {
	title: string;
	summary: string;
	description: string;
	tags: string[];
	url: string;
}

	export interface Env {
	GEMINI_API_KEY: string;
	GEMINI_SYSTEM_PROMPT: string;
	ALLOWED_ORIGINS?: string;
	RATE_LIMIT_KV: KVNamespace;
	        PROJECT_EMBEDDINGS_KV: KVNamespace;
        PROJECT_SEARCH_SIMILARITY_THRESHOLD?: string;
	EMBEDDING_SECRET?: string; // Added EMBEDDING_SECRET
	RESUME_SIGNER_SECRET?: string; // Added RESUME_SIGNER_SECRET
	TURNSTILE_SECRET_KEY?: string; // Added for Turnstile verification
	RECRUITER_WHITELIST_EMAIL?: string; // Added for recruiter whitelist
	VITE_WORKER_URL?: string; // Added VITE_WORKER_URL	        // Ensure this KV namespace is bound in your worker's environment.
	        // If not bound, embedding-related functionalities will be disabled or throw errors.
	ENVIRONMENT?: string;
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
	toolResponse?: any;
	history?: any[];
}

interface EmbeddingRequest {
	text: string;
}

// Helper to create a structured JSON response
export const jsonResponse = (data: object, status: number, headers: HeadersInit = {}) => {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers },
	});
};

export const createErrorResponse = (message: string, status: number, corsHeaders: HeadersInit = {}, securityHeaders: HeadersInit = {}) => {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders },
	});
};

async function validateGeminiKey(apiKey: string): Promise<boolean> {
	try {
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
		// A simple, low-cost prompt to validate the key
		await model.generateContent('ping');
		return true;
	} catch (error) {
		console.error('Gemini API key validation failed:', error);
		return false;
	}
}

// Helper: retry async operations with exponential backoff + jitter for transient errors
export async function withRetries<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 1000): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // If error clearly non-transient (client error), rethrow immediately
      const status = (err && typeof err === 'object' && 'status' in err) ? (err as any).status : null;
      if (status && status < 500) throw err;
      const backoff = baseDelayMs * Math.pow(2, i) + Math.floor(Math.random() * 200);
      console.warn(`Transient error (attempt ${i + 1}/${attempts}), retrying in ${backoff}ms:`, err);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

interface TurnstileResponse {
  success: boolean;
}

// Function to verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string, secretKey: string, ip?: string): Promise<boolean> {
  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (ip) {
    formData.append('remoteip', ip);
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const data = (await response.json()) as TurnstileResponse;
    return data.success;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
}

// Function to check if an email is in the recruiter whitelist
function isRecruiterWhitelisted(email: string, whitelist: string | undefined): boolean {
  if (!whitelist) return false;
  const whitelistedEmails = whitelist.split(',').map(e => e.trim().toLowerCase());
  return whitelistedEmails.includes(email.toLowerCase());
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const origin = request.headers.get('Origin') || '';
		const allowedOrigins = (env.ALLOWED_ORIGINS || 'https://gmpho.github.io", "http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);
		const isAllowed = origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'));

		const connectSrc = `'self' https://api.cloudflare.com ${env.VITE_WORKER_URL ? new URL(env.VITE_WORKER_URL).origin : ''}`;
		const securityHeaders: HeadersInit = {
			'Content-Security-Policy': `default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' https://fonts.googleapis.com 'sha256-k5XIPg4LZqX54os5EJ1isWXPsHx/TxPYW8FMPJXzvWU='; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; connect-src ${connectSrc};`,
			'X-Frame-Options': 'DENY',
			'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
			'Referrer-Policy': 'no-referrer-when-downgrade',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		};

		const corsHeaders: HeadersInit = {};
		if (isAllowed) {
			corsHeaders['Access-Control-Allow-Origin'] = origin;
			corsHeaders['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
			corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
			corsHeaders['Access-Control-Allow-Credentials'] = 'true';
			corsHeaders['Access-Control-Max-Age'] = '86400'; // Cache preflight requests for 24 hours
		} else if (origin && !isAllowed) {
			// Explicitly block requests from disallowed origins
			return createErrorResponse('Forbidden', 403, corsHeaders, securityHeaders);
		}

		// Handle preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					...corsHeaders,
					...securityHeaders,
				},
			});
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
                        html, body { height: 100%; width: 100%; }
                        body { font-family: sans-serif; display: grid; place-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
                        .container { max-width: 400px; margin: auto; text-align: center; padding: 2rem; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        h1 { color: #1c1e21; }
                        p { color: #606770; }
                    </style>
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
				headers: { 'Content-Type': 'text/html', ...corsHeaders, ...securityHeaders },
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
				{ ...corsHeaders, ...securityHeaders },
			);
		}

		// Apply server-side rate-limiting
		const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
		const rateLimitResult = await checkRateLimit(clientIp, env);

		if (!rateLimitResult.allowed) {
			return createErrorResponse('Too Many Requests', 429, {
				'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
				...corsHeaders,
			}, securityHeaders);
		}

		        		        if (url.pathname === '/contact') {

		        		            if (request.method !== 'POST') {

		        		                return createErrorResponse('Method Not Allowed', 405, corsHeaders, securityHeaders);

		        		            }

		        			            try {

		        			                const requestBody = await request.json();

		        			                const validationResult = ContactFormSchema.safeParse(requestBody);

		        			

		        			                if (!validationResult.success) {

		        			                    return createErrorResponse(`Invalid contact form data: ${JSON.stringify(validationResult.error.flatten().fieldErrors)}`, 400, corsHeaders, securityHeaders);

		        			                }

		        			

		        			                const { name, email, message, 'cf-turnstile-response': turnstileToken } = validationResult.data;

		        			

		                                    // 1. Turnstile Verification

		                                    if (!env.TURNSTILE_SECRET_KEY) {

		                                        console.warn('TURNSTILE_SECRET_KEY is not set. Skipping Turnstile verification.');

		                                    } else if (!turnstileToken) {

		                                        return createErrorResponse('Turnstile token missing.', 400, corsHeaders, securityHeaders);

		                                    } else {

		                                        const clientIp = request.headers.get('CF-Connecting-IP') || undefined;

		                                        const isTurnstileValid = await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp);

		                                        if (!isTurnstileValid) {

		                                            return createErrorResponse('Invalid Turnstile token. Please try again.', 403, corsHeaders, securityHeaders);

		                                        }

		                                    }

		        

		                                    // 2. Recruiter Whitelist Logic

		                                    const isWhitelisted = isRecruiterWhitelisted(email, env.RECRUITER_WHITELIST_EMAIL);

		                                    if (isWhitelisted) {

		                                        console.log(`Whitelisted recruiter email received: ${email}`);

		                                        // Potentially handle whitelisted emails differently, e.g., forward to a specific inbox

		                                    }

		        			

		        							// In a real application, you would integrate with an email sending service here.

		        							// For this example, we'll just simulate a successful send.

		        							console.log(`Received contact form submission:\nName: ${name.replace(/\s/g, ' ')}\nEmail: ${email.replace(/\s/g, ' ')}\nMessage: ${message.replace(/\s/g, ' ')}`);

		        			

		        							// Simulate a delay for sending email

		        							await new Promise((resolve) => setTimeout(resolve, 1000));

		        			

		        							// Simulate success

		        							return jsonResponse({ status: 'sent' }, 200, { ...corsHeaders, ...securityHeaders });

		        						} catch (error) {

		        							console.error('Error processing contact form submission:', error);

		        							return createErrorResponse('Sorry, I’m having trouble answering that right now.', 500, corsHeaders, securityHeaders);

		        						}		}

		if (url.pathname === '/resume') {
			return handleResumeRequest(request, env, corsHeaders, securityHeaders);
		}

		if (url.pathname === '/api/generateEmbedding') {
			if (request.method !== 'POST') {
				return createErrorResponse('Method Not Allowed', 405, corsHeaders, securityHeaders);
			}

			if (!env.GEMINI_API_KEY) {
				console.error('GEMINI_API_KEY is not set.');
				return createErrorResponse('Missing server configuration', 500, corsHeaders, securityHeaders);
			}

			try {
				                const requestBody = await request.json();
				                const validationResult = GenerateEmbeddingRequestSchema.safeParse(requestBody);
				
				                if (!validationResult.success) {
				                    return createErrorResponse(`Invalid request body: ${JSON.stringify(validationResult.error.flatten().fieldErrors)}`, 400, corsHeaders, securityHeaders);
				                }
				
				                const { text } = validationResult.data;
				// Apply guardrails to the incoming text
				if (checkGuardrails(text)) {
					return createErrorResponse('I am sorry, I cannot process that request.', 400, corsHeaders, securityHeaders);
				}

				const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
				const model = genAI.getGenerativeModel({ model: 'embedding-001' }); // Use the embedding model

				const result = await model.embedContent(text);
				const embedding = result.embedding.values;

				return jsonResponse({ embedding }, 200, { ...corsHeaders, ...securityHeaders });
			            } catch (error: any) {
							if (error.status === 429) {
								console.warn('Quota exceeded for embedding generation.');
								return createErrorResponse('Quota exceeded for embedding generation. Please try again later.', 429, corsHeaders, securityHeaders);
							}
			                console.error('Error generating embedding:', error);
			                return createErrorResponse('Sorry, I’m having trouble generating the embedding right now.', 500, corsHeaders, securityHeaders);
			            }		}

											if (url.pathname === '/chat') {
															
												return handleChat(request, env, corsHeaders, securityHeaders);
															
											}														
				
																// Default to 404 Not Found for any unhandled paths
				
																return createErrorResponse('Not Found', 404, corsHeaders, securityHeaders);
				
																	}
				
														} satisfies ExportedHandler<Env>;
