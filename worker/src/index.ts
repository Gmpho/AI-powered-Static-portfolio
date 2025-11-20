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
import { statusPageHtml } from './status-page';

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

// CORS middleware setup
const defaultProdOrigins = 'https://gmpho.github.io';
const defaultDevOrigins = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8787';

app.use('*', (c, next) => {
    const allowedOriginsString = c.env.ALLOWED_ORIGINS || (c.env.ENVIRONMENT === 'production' ? defaultProdOrigins : defaultDevOrigins);
    const allowedOrigins = allowedOriginsString.split(',').map(s => s.trim());

    const corsMiddleware = cors({
        origin: (origin) => {
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                return origin;
            }
            // Return null to deny the origin
            return null;
        },
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
        maxAge: 86400,
        credentials: true,
    });
    return corsMiddleware(c, next);
});

// Apply secure headers after CORS
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
  return c.html(statusPageHtml);
});



export default app;

