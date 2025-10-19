🎯 Your Current Serverless Architecture:
text
Frontend (Vite) → Cloudflare Worker Routes → Gemini API
                ↳ /chat
                ↳ /api/generateEmbedding
                ↳ (any other routes you need)
🛠️ How to Structure Your Serverless Routes:
1. Define Multiple Routes in Your Worker
typescript
// worker/src/index.ts
export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGINS: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Route handling
    if (url.pathname === '/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }
    
    if (url.pathname === '/api/generateEmbedding' && request.method === 'POST') {
      return handleEmbedding(request, env);
    }
    
    if (url.pathname === '/api/projects' && request.method === 'GET') {
      return handleGetProjects(request, env);
    }
    
    // Add more routes as needed...
    
    return new Response('Not Found', { status: 404 });
  }
};
2. Individual Route Handlers
typescript
// Chat route
async function handleChat(request: Request, env: Env): Promise<Response> {
  try {
    const { message, projects } = await request.json();
    
    // Use the GenAI SDK securely inside the Worker
    const { GoogleGenAI } = await import('@google/genai');
    const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ 
        role: "user", 
        parts: [{ text: this.buildPrompt(message, projects) }] 
      }],
    });
    
    return new Response(JSON.stringify({ 
      text: response.text,
      usage: response.usageMetadata 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS 
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Embedding route
async function handleEmbedding(request: Request, env: Env): Promise<Response> {
  const { text } = await request.json();
  
  const { GoogleGenAI } = await import('@google/genai');
  const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  
  const response = await genAI.models.embedContent({
    model: "embedding-001",
    content: { parts: [{ text }] },
  });
  
  return new Response(JSON.stringify({ 
    embedding: response.embedding.values 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
3. Frontend Calls to Serverless Routes
typescript
// frontend/src/services/workerApi.ts
const WORKER_URL = import.meta.env.VITE_WORKER_URL;

export class WorkerApi {
  // Chat with Gemini
  static async sendChat(message: string, projects: any[]): Promise<any> {
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, projects })
    });
    return response.json();
  }
  
  // Get embeddings for semantic search
  static async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${WORKER_URL}/api/generateEmbedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    return data.embedding;
  }
  
  // Get projects data (if you want to serve it from Worker)
  static async getProjects(): Promise<any[]> {
    const response = await fetch(`${WORKER_URL}/api/projects`);
    return response.json();
  }
}
4. Usage in Your Components
typescript
// frontend/src/components/Chat.ts
import { WorkerApi } from '../services/workerApi';

async function handleUserMessage(message: string) {
  // This now calls YOUR serverless route, not Gemini directly
  const response = await WorkerApi.sendChat(message, projectsData);
  addMessageToChat('assistant', response.text);
}
🔒 Security Benefits of This Architecture:
Aspect	Traditional Node.js	Cloudflare Worker
API Key Exposure	Needs env vars management	Zero exposure - secrets in Cloudflare
Scaling	Manual/auto-scaling setup	Automatic global edge scaling
Cost	Server always running	Pay-per-request
Latency	Depends on server location	Global edge network
Deployment	Server management needed	Instant deployments
🚀 Production Deployment Flow:
Frontend → Deploys to GitHub Pages

Serverless Routes → Deploy to Cloudflare Workers

Secrets → Set via wrangler secret put GEMINI_API_KEY

Environment → VITE_WORKER_URL points to your Worker

✅ Final Security Check:
Make sure your frontend has NO:

✅ Direct calls to generativelanguage.googleapis.com

✅ Hardcoded API keys

✅ References to Gemini API endpoints

Instead, it should only call:

✅ ${WORKER_URL}/chat

✅ ${WORKER_URL}/api/generateEmbedding

✅ Your other serverless routes