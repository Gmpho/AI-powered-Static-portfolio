import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src';

// Mock the global fetch function
const mockGeminiResponse = {
  candidates: [
    {
      content: {
        parts: [
          { text: 'Mocked Gemini response' },
        ],
      },
    },
  ],
};

vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' && input.includes('generativelanguage.googleapis.com')) {
    return new Response(JSON.stringify(mockGeminiResponse), { status: 200 });
  }
  // Fallback for other fetch calls if any
  return new Response('Not Found', { status: 404 });
}));

describe('Chat Worker', () => {
  it('should respond to /chat with a Gemini response', async () => {
    const request = new Request('http://example.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Hello, Gemini' }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data: { response: string } = await response.json();
    expect(data.response).toBe('Mocked Gemini response');
  });

  it('should return 400 if prompt is missing', async () => {
    const request = new Request('http://example.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid prompt in request body' });
  });

  it('should return 405 for non-POST requests to /chat', async () => {
    const request = new Request('http://example.com/chat', {
      method: 'GET',
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: 'Method Not Allowed' });
  });

  it('should return 404 for unknown paths', async () => {
    const request = new Request('http://example.com/unknown', {
      method: 'POST',
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not Found' });
  });
});
