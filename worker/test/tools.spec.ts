import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleToolCall } from '../src/handleToolCall';
import { Env } from '../src/index';
import { FunctionCall, Part } from '@google/generative-ai';

describe('handleToolCall', () => {
    let mockEnv: Env;

    beforeEach(() => {
        vi.clearAllMocks();
        mockEnv = {
            GEMINI_API_KEY: 'test-api-key',
            RATE_LIMIT_KV: { get: vi.fn(), put: vi.fn() } as any,
            PROJECT_EMBEDDINGS_KV: { get: vi.fn(), put: vi.fn(), list: vi.fn().mockResolvedValue({ keys: [] }) } as any,
            ALLOWED_ORIGINS: 'http://localhost:5173',
        };
    });

    it('should return a Part object for projectSearch', async () => {
        const functionCall = { name: 'projectSearch', args: { query: 'AI projects' } };
        const result = await handleToolCall(functionCall, mockEnv, {});
        // Assert that the result is a Part object and then access its properties
        expect(result).toHaveProperty('functionResponse');
        const partResult = result as Part; // Type assertion
        if (partResult.functionResponse) { // Type guard
            expect(partResult.functionResponse).toBeDefined();
            expect(partResult.functionResponse.name).toBe('projectSearch');
            expect(partResult.functionResponse.response).toBeDefined();
        } else {
            expect.fail('Expected result to be a FunctionResponsePart');
        }
    });

    it('should return a Response object for displayContactForm', async () => {
        const functionCall = { name: 'displayContactForm', args: {} };
        const result = await handleToolCall(functionCall, mockEnv, {});
        expect(result).toBeInstanceOf(Response);
    });

    it('should return a 400 Response for an unknown tool', async () => {
        const functionCall = { name: 'unknownTool', args: {} };
        const result = await handleToolCall(functionCall, mockEnv, {});
        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(400);
    });
});
