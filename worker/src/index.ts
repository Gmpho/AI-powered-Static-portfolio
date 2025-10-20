import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { checkRateLimit } from './rateLimiter';
import { sanitizeOutput, checkInjection } from './guardrails'; // Import checkInjection
import { handleToolCall } from './handleToolCall';
import { projectSearchSchema } from './tools/projectSearch';
import { displayContactFormSchema } from './tools/displayContactForm';
import { contactFormSchema } from './schemas';

interface Project {
	title: string;
	summary: string;
	description: string;
	tags: string[];
	url: string;
}

export interface Env {
	GEMINI_API_KEY: string;
	ALLOWED_ORIGINS?: string;
	RATE_LIMIT_KV: KVNamespace;
	        PROJECT_EMBEDDINGS_KV: KVNamespace;
        PROJECT_SEARCH_SIMILARITY_THRESHOLD?: string;
	EMBEDDING_SECRET?: string; // Added EMBEDDING_SECRET
	        // Ensure this KV namespace is bound in your worker's environment.
	        // If not bound, embedding-related functionalities will be disabled or throw errors.
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

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
const origin = request.headers.get('Origin') || '';
		const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');

		const securityHeaders: HeadersInit = {
			'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.cloudflare.com;",
			'X-Frame-Options': 'DENY',
			'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
			'Referrer-Policy': 'no-referrer-when-downgrade',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		};
		const corsHeaders: HeadersInit = {};
		if (allowedOrigins.includes(origin)) {
			corsHeaders['Access-Control-Allow-Origin'] = origin;
			corsHeaders['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
			corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type';
			corsHeaders['Access-Control-Max-Age'] = '86400'; // Cache preflight requests for 24 hours
		} else if (origin && !allowedOrigins.includes(origin)) {
			// Explicitly block requests from disallowed origins
			return createErrorResponse('Forbidden', 403, corsHeaders, securityHeaders);
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
			                const validationResult = contactFormSchema.safeParse(requestBody);
			
			                if (!validationResult.success) {
			                    return createErrorResponse(`Invalid contact form data: ${JSON.stringify(validationResult.error.flatten().fieldErrors)}`, 400, corsHeaders, securityHeaders);
			                }
			
			                const { name, email, message } = validationResult.data;
			
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

		if (url.pathname === '/api/generateEmbedding') {
			if (request.method !== 'POST') {
				return createErrorResponse('Method Not Allowed', 405, corsHeaders, securityHeaders);
			}

			if (!env.GEMINI_API_KEY) {
				console.error('GEMINI_API_KEY is not set.');
				return createErrorResponse('Missing server configuration', 500, corsHeaders, securityHeaders);
			}

			try {
				const requestBody: EmbeddingRequest = await request.json();
				const { text } = requestBody;

				if (!text || typeof text !== 'string' || text.trim().length === 0) {
					return createErrorResponse('Invalid text in request body', 400, corsHeaders, securityHeaders);
				}

				// Apply guardrails to the incoming text
				if (checkInjection(text)) {
					return createErrorResponse('I am sorry, I cannot process that request.', 400, corsHeaders, securityHeaders);
				}

				const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
				const model = genAI.getGenerativeModel({ model: 'embedding-001' }); // Use the embedding model

				const result = await model.embedContent(text);
				const embedding = result.embedding.values;

				return jsonResponse({ embedding }, 200, { ...corsHeaders, ...securityHeaders });
			} catch (error) {
				console.error('Error generating embedding:', error);
				return createErrorResponse('Sorry, I’m having trouble generating the embedding right now.', 500, corsHeaders, securityHeaders);
			}
		}

		if (url.pathname !== '/chat') {
			return createErrorResponse('Not Found', 404, corsHeaders, securityHeaders);
		}

		if (request.method !== 'POST') {
			return createErrorResponse('Method Not Allowed', 405, corsHeaders, securityHeaders);
		}

		if (!env.GEMINI_API_KEY) {
			console.error('GEMINI_API_KEY is not set.');

			return createErrorResponse('Missing server configuration', 500, corsHeaders, securityHeaders);
		}

		try {
			const requestBody: ChatRequest = await request.json();
			                        const { prompt, persona, projects, toolResponse, history } = requestBody;
			            
			                        // Apply guardrails to the incoming prompt
			                        if (prompt && checkInjection(prompt)) {
			                            return jsonResponse({ error: "I am sorry, I cannot process that request." }, 400, { ...corsHeaders, ...securityHeaders });
			                        }
			            
			                        const systemPrompt = `You are AG Gift, an innovative, witty, and insightful AI assistant, built by Gift Himself. Your mission is to engage visitors with descriptive and enthusiastic explanations, making technical topics accessible and exciting. You are professional, lively, and a bit witty.
			            
			            Introduce G.E.M. services as: Generative AI Engineering & Maintenance🚀😊.
			            
			            When discussing projects, ONLY use the provided project data below. DO NOT invent details or information not explicitly present. If a question is outside the scope of the portfolio projects, or if you cannot find relevant information within the provided data, politely state that you can only discuss the portfolio projects.
			            
			            Present project information in an engaging and descriptive manner, highlighting key features, technologies, and the impact of the work. When listing multiple projects, use numbered lists or bullet points, and **always list all available projects**. Keep responses concise (1-2 short paragraphs) unless the user asks for more detail.
			            
			            --- Available Projects ---
			            ${projects ? projects.map(p => `Title: ${p.title}\nSummary: ${p.summary}\nDescription: ${p.description}\nTags: ${p.tags.join(', ')}\nURL: ${p.url}`).join('\n\n') : 'No project data available.'}
			            --- End Available Projects ---
			            `;
			            
			                        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
			                            return createErrorResponse('Invalid prompt in request body', 400, corsHeaders, securityHeaders);
			                        }
			            
			                        // Use the Google Generative AI SDK
			                        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
			                        console.log('Tools being sent to Gemini API:', [projectSearchSchema as any, displayContactFormSchema as any]);
			                        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', tools: [{ functionDeclarations: [projectSearchSchema, displayContactFormSchema] }], systemInstruction: systemPrompt });
			            
			                        const stream = await model.generateContentStream(prompt);
			                        const readableStream = new ReadableStream({

			                            async start(controller) {

			                                const encoder = new TextEncoder();

			                                let hasEnqueuedData = false;

			                                try {

			                                    for await (const chunk of stream.stream) {
			                                        // Check for function calls first
			                                        const functionCallPart = chunk.candidates?.[0]?.content?.parts?.find(
			                                            (part: Part) => 'functionCall' in part
			                                        );

			                                        if (functionCallPart && functionCallPart.functionCall) {
			                                            console.log('Detected function call:', functionCallPart.functionCall.name);
			                                            const toolResult = await handleToolCall(
			                                                functionCallPart.functionCall,
			                                                env,
			                                                corsHeaders
			                                            );

			                                            if (toolResult instanceof Response) {
			                                                // If handleToolCall returns a direct Response, enqueue it and close the stream
			                                                const responseBody = await toolResult.text();
			                                                controller.enqueue(encoder.encode(`data: ${responseBody}\n\n`));
			                                                controller.close();
			                                                return;
			                                            } else {
			                                                // If handleToolCall returns a Part, enqueue it for the model to process
			                                                controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolResult)}\n\n`));
			                                                hasEnqueuedData = true;
			                                            }
			                                        } else {
			                                            // Otherwise, process as regular text
			                                            const rawText = chunk.text();
			                                            const sanitizedText = sanitizeOutput(rawText);

			                                            if (sanitizedText) {
			                                                controller.enqueue(encoder.encode(`data: ${sanitizedText}\n\n`));
			                                                hasEnqueuedData = true;
			                                            }
			                                        }
			                                    }

			                                    if (!hasEnqueuedData) {

			                                        controller.enqueue(encoder.encode(`data: {"error": "Gemini stream returned no data."}\n\n`));

			                                                                                               }                                                                                   

			                                                                                                                                                                        

			                                                                                           } catch (e) {                                                                           

			                                                                                               console.error('Error during Gemini stream iteration:', e);                          

			                                                                                               controller.enqueue(encoder.encode(`data: {"error": "Stream error: ${e instanceof

			                                     Error ? e.message : String(e)}"}\n\n`));                                                                                                       

			                                                                                               controller.error(e);

			                                                                                           } finally {                                                                             

			                                                                                                                                                                                   

			                                                                                               controller.close();

			                                }

			                            },

			                            cancel() {

			                                console.log('Stream cancelled by client.');

			                            }

			                        });

			            

			                        return new Response(readableStream, {

			            

			                        			                            headers: {

			            

			                        			                                'Content-Type': 'text/event-stream',

			            

			                        			                                'Cache-Control': 'no-cache',

			            

			                        			                                'Connection': 'keep-alive',

			            

			                        			                                ...corsHeaders,

			            

			                        			                                ...securityHeaders,

			            

			                        			                            },

			            

			                        			                        });			} catch (error) {
				                               console.error('Error processing chat request:', error);
				                               return createErrorResponse('Sorry, I’m having trouble answering that right now.', 503, corsHeaders, securityHeaders);
				                       }
				               },} satisfies ExportedHandler<Env>;
