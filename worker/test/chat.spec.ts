import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src';

// Mock the global fetch function
const mockGeminiResponse = {
	candidates: [
		{
			content: {
				parts: [{ text: 'Mocked Gemini response' }],
			},
		},
	],
};

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
	if (typeof input === 'string' && input.includes('generativelanguage.googleapis.com')) {
		return new Response(JSON.stringify(mockGeminiResponse), { status: 200 });
	}
	// Fallback for other fetch calls if any
	return new Response('Not Found', { status: 404 });
});
vi.stubGlobal('fetch', fetchMock);

describe('Chat Worker', () => {
	beforeEach(() => {
		fetchMock.mockClear();
		// Reset the mock implementation to the default successful response
		fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
			if (typeof input === 'string' && input.includes('generativelanguage.googleapis.com')) {
				return new Response(JSON.stringify(mockGeminiResponse), { status: 200 });
			}
			return new Response('Not Found', { status: 404 });
		});
	});

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

	it('should always use the hardcoded persona', async () => {
		const request = new Request('http://example.com/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt: 'Hello', persona: 'any_persona' }),
		});

		const ctx = createExecutionContext();
		await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(fetchMock).toHaveBeenCalled();
		const fetchBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
		const promptSent = fetchBody.contents[0].parts[0].text;
		expect(promptSent).toContain('You are AG Gift, a witty and helpful AI assistant.');
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

	it('should rate limit requests from the same IP', async () => {
		const clientIp = '192.168.1.1';
		const MAX_REQUESTS = 10;

		for (let i = 0; i < MAX_REQUESTS; i++) {
			const request = new Request('http://example.com/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': clientIp },
				body: JSON.stringify({ prompt: `Hello ${i}` }),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
		}

		const rateLimitedRequest = new Request('http://example.com/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': clientIp },
			body: JSON.stringify({ prompt: 'Hello again' }),
		});

		const ctx = createExecutionContext();
		const rateLimitedResponse = await worker.fetch(rateLimitedRequest, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(rateLimitedResponse.status).toBe(429);
		const errorResponse: { error: string } = await rateLimitedResponse.json();
		expect(errorResponse.error).toBe('Too Many Requests');
	});

	it('should handle Gemini API failure', async () => {
		fetchMock.mockImplementationOnce(async (input: RequestInfo | URL, init?: RequestInit) => {
			if (typeof input === 'string' && input.includes('generativelanguage.googleapis.com')) {
				return new Response('Internal Server Error', { status: 500 });
			}
			return new Response('Not Found', { status: 404 });
		});

		const request = new Request('http://example.com/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt: 'Hello' }),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(503);
		const data = await response.json();
		expect(data.error).toBe('Sorry, I’m having trouble answering that right now.');
	});
});
