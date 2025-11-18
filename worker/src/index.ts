import { GoogleGenerativeAI } from '@google/generative-ai';
import { Context, Hono } from 'hono';
import { cache } from 'hono/cache';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from 'hono/serve-static';
import { checkRateLimit } from './rateLimiter';
import { checkGuardrails } from './guardrails';
import { ContactFormSchema, GenerateEmbeddingRequestSchema } from './schemas';
import { handleResumeRequest } from './resume';
import { handleChat } from './chat';

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
	ALLOWED_ORIGINS: string;
	RATE_LIMIT_KV: KVNamespace;
	        PROJECT_EMBEDDINGS_KV: KVNamespace;
        PROJECT_SEARCH_SIMILARITY_THRESHOLD?: string;
	EMBEDDING_SECRET?: string; // Added EMBEDDING_SECRET
	EMBEDDING_API_KEY?: string; // Added for embedding endpoint authentication
	RESUME_SIGNER_SECRET?: string; // Added RESUME_SIGNER_SECRET
	TURNSTILE_SECRET_KEY?: string; // Added for Turnstile verification
	RECRUITER_WHITELIST_EMAIL?: string; // Added for recruiter whitelist
	VITE_WORKER_URL?: string; // Added VITE_WORKER_URL	        // Ensure this KV namespace is bound in your worker's environment.
	        // If not bound, embedding-related functionalities will be disabled or throw errors.
	ENVIRONMENT?: string;
	ASSETS: Fetcher;
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


// We will adapt createErrorResponse to work with Hono's context
export const createErrorResponse = (c: any, message: string, status: number) => {
	console.error(`createErrorResponse: Message: ${message}, Status: ${status}`);
	return c.json({ error: message }, status);
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

// Helper function to determine MIME type
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return 'text/html';
    case 'css': return 'text/css';
    case 'js': return 'application/javascript';
    case 'json': return 'application/json';
    case 'png': return 'image/png';
    case 'jpg': return 'image/jpeg';
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'ico': return 'image/x-icon';
    case 'webp': return 'image/webp';
    case 'webmanifest': return 'application/manifest+json';
    default: return 'application/octet-stream';
  }
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
	origin: (origin, c) => {
		const allowedOriginsString = c.env.ALLOWED_ORIGINS || (c.env.ENVIRONMENT === 'production' ? 'https://gmpho.github.io' : 'http://localhost:5173,https://gmpho.github.io');
		const allowedOrigins = allowedOriginsString.split(',').map((s: string) => s.trim()).filter(Boolean);
		console.log(`CORS check: Incoming origin: ${origin}, Allowed origins: ${allowedOrigins.join(', ')}`);
		if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
			console.log(`CORS check: Origin ${origin} is allowed.`);
			return origin;
		}
		console.log(`CORS check: Origin ${origin} is NOT allowed.`);
		return 'null'; // Deny if not in allowed list
	},
	allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	allowMethods: ['GET', 'POST', 'OPTIONS'],
	exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
	maxAge: 86400,
	credentials: true,
}));

app.use('*', secureHeaders());
app.post('/chat', async (c) => handleChat(c, c.req.raw, c.env));

app.get('/chat', (c) => {
	return c.json({
		error: 'Method Not Allowed',
		message: 'This endpoint is for the chatbot and only accepts POST requests.',
		suggestion:
			"Please use the portfolio's chat interface to interact with the bot.",
	}, 405);
});

// Explicitly return 404 for sw.js and manifest.json as they are not used
app.get('/AI-powered-Static-portfolio/sw.js', (c) => {
  return c.notFound();
});

app.get('/AI-powered-Static-portfolio/manifest.json', (c) => {
  return c.notFound();
});

// Serve static assets from the '/AI-powered-Static-portfolio/assets/*' path
app.use('/AI-powered-Static-portfolio/assets/*', serveStatic({
  rewriteRequestPath: (path) => {
    const newPath = path.replace(/^\/AI-powered-Static-portfolio/, '');
    console.log(`Rewriting asset path: ${path} to ${newPath}`);
    return newPath;
  },
  getContent: async (path, c) => {
    const assetPath = path.startsWith('/') ? path : `/${path}`; // Ensure path starts with /
    console.log(`Fetching asset from ASSETS binding: ${assetPath}`);
    const response = await (c.env as Env).ASSETS.fetch(new Request(new URL(assetPath, c.req.url)));
    const mimeType = getMimeType(assetPath);
    const headers = new Headers(response.headers);
    headers.set('Content-Type', mimeType);
    console.log(`Fetched asset: ${assetPath}, Original Content-Type: ${response.headers.get('Content-Type')}, Set Content-Type: ${mimeType}`);
    return new Response(response.body, { status: response.status, headers });
  },
}));

// SPA fallback: serve index.html for all other routes under '/AI-powered-Static-portfolio/*'
app.get('/AI-powered-Static-portfolio/*', serveStatic({
  path: 'index.html', // path relative to the ASSETS binding root
  rewriteRequestPath: (path) => {
    const newPath = path.replace(/^\/AI-powered-Static-portfolio/, '');
    console.log(`Rewriting SPA fallback path: ${path} to ${newPath}`);
    return newPath;
  },
  getContent: async (path, c) => {
    const assetPath = path.startsWith('/') ? path : `/${path}`; // Ensure path starts with /
    console.log(`Fetching SPA fallback from ASSETS binding: ${assetPath}`);
    const response = await (c.env as Env).ASSETS.fetch(new Request(new URL(assetPath, c.req.url)));
    const mimeType = getMimeType(assetPath);
    const headers = new Headers(response.headers);
    headers.set('Content-Type', mimeType);
    console.log(`Fetched SPA fallback: ${assetPath}, Original Content-Type: ${response.headers.get('Content-Type')}, Set Content-Type: ${mimeType}`);
    return new Response(response.body, { status: response.status, headers });
  },
}));

// Catch-all for the root path and anything not matched above, serving the worker status HTML
app.get('/*', (c) => {
  const htmlResponse = `
    <!doctype html>
    <html lang="en" class="fouc-hidden">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>API Status - AI-Powered Portfolio Worker</title>
        <style>
          :root {
            --color-primary: #4f46e5;
            --color-primary-hover: #4338ca;
            --color-primary-light: #eef2ff;
            --color-primary-disabled: #a5b4fc;
            --color-primary-rgb: 79, 70, 229; /* RGB for #4f46e5 */

            --color-bg: #f8fafc;
            --color-surface: #ffffff;
            --color-surface-rgb: 255, 255, 255; /* RGB for #ffffff */
            --color-surface-alt: #f1f5f9;
            --color-border: #e2e8f0;
            --color-shadow: rgba(0, 0, 0, 0.05);

            --color-text-primary: #1e293b;
            --color-text-secondary: #64748b;
            --color-text-on-primary: #ffffff;

            --color-danger: #ef4444;
            --color-danger-glow: rgba(239, 68, 68, 0.4);
          }

          [data-theme="dark"] {
            --color-primary: #6366f1;
            --color-primary-hover: #4f46e5;
            --color-primary-light: #3730a3;
            --color-primary-disabled: #4f46e5;
            --color-primary-rgb: 99, 102, 241; /* RGB for #6366f1 */

            --color-bg: #0f172a;
            --color-surface: #1e293b;
            --color-surface-rgb: 30, 41, 59; /* RGB for #1e293b */
            --color-surface-alt: #334155;
            --color-border: #475569;
            --color-shadow: rgba(0, 0, 0, 0.2);

            --color-text-primary: #f1f5f9;
            --color-text-secondary: #94a3b8;
            --color-text-on-primary: #ffffff;

            --color-danger: #f87171;
            --color-danger-glow: rgba(248, 113, 113, 0.4);
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: "Inter", sans-serif;
            background-color: var(--color-bg);
            color: var(--color-text-primary);
            line-height: 1.6;
            transition:
              background-color 0.3s ease,
              color 0.3s ease;
            display: grid;
            place-items: center;
            min-height: 100vh;
            text-align: center;
          }

          .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 2rem;
          }

          .status-card {
            background-color: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: 0.75rem;
            padding: 3rem;
            box-shadow: 0 4px 6px -1px var(--color-shadow);
            max-width: 400px;
            margin: 2rem auto;
          }

          .status-card h1 {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            color: var(--color-text-primary);
          }

          .status-card p {
            font-size: 1.1rem;
            color: var(--color-text-secondary);
            margin-bottom: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status-card">
            <h1>✅ AI-Powered Portfolio Worker is Running</h1>
            <p>This is the backend API for the AI Portfolio. It only responds to POST requests at the <code style="background-color: var(--color-surface-alt); padding: 0.2em 0.4em; border-radius: 0.25em; font-family: monospace;">/chat</code> endpoint.</p>
          </div>
        </div>
      </body>
    </html>
`;
  return c.html(htmlResponse);
});



export default app;

