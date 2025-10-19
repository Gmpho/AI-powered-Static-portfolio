import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleToolCall } from '../src/handleToolCall';
import { Env } from '../src/index';
import { Part } from '@google/generative-ai';

// Mock the GoogleGenerativeAI module
vi.mock('@google/generative-ai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@google/generative-ai')>();
    return {
        ...actual,
        GoogleGenerativeAI: vi.fn(() => ({
            getGenerativeModel: vi.fn(() => ({
                embedContent: vi.fn((text: string) => {
                    // Return a predictable embedding based on the input text
                    if (text.includes('trading bot')) {
                        return { embedding: { values: [0.1, 0.2, 0.3] } };
                    }
                    if (text.includes('web development')) {
                        return { embedding: { values: [0.4, 0.5, 0.6] } };
                    }
                    return { embedding: { values: [0.0, 0.0, 0.0] } };
                }),
            })),
        })),
    };
});

describe('handleToolCall', () => {
    let mockEnv: Env;

    beforeEach(() => {
        vi.resetAllMocks();
        mockEnv = {
            GEMINI_API_KEY: 'test-api-key',
            RATE_LIMIT_KV: { get: vi.fn(), put: vi.fn() } as any,
            PROJECT_EMBEDDINGS_KV: {
                get: vi.fn((key: string) => {
                    // Mock KV to return specific embeddings for projects
                                        if (key === 'crypto_pulse_ai') {
                                            return Promise.resolve(JSON.stringify([0.1, 0.2, 0.3])); // Make this identical to the 'trading bot' query embedding for a perfect match
                                        }
                                        if (key === 'student_programming_hub') {
                                            return Promise.resolve(JSON.stringify([0.9, 0.8, 0.7])); // Different embedding
                                        }
                                        return Promise.resolve(null);
                                    }),
                                    put: vi.fn(),
                                    list: vi.fn().mockResolvedValue({
                                        keys: [
                                            { name: 'crypto_pulse_ai' },
                                        ],
                                    }),
                                } as any,
                                ALLOWED_ORIGINS: 'http://localhost:5173',
                            };
                        });
                    
                        it('should return a Part object for projectSearch with semantic results', async () => {
                            const functionCall = { name: 'projectSearch', args: { query: 'tell me about your trading bot projects' } };
                            const result = await handleToolCall(functionCall, mockEnv, {});
                    
                                    expect(result).toHaveProperty('functionResponse');
                                    const partResult = result as Part;
                                    if (partResult.functionResponse) {
                                        expect(partResult.functionResponse.name).toBe('projectSearch');
                                        expect(partResult.functionResponse.response).toHaveProperty('projects');
                                        const projects = (partResult.functionResponse.response as { projects: any[]; notice?: string }).projects;
                                        expect(projects).toHaveLength(1);
                                        expect(projects[0].title).toContain('Crypto Pulse AI');
                                    } else {
                                        expect.fail('Expected result to be a FunctionResponsePart');
                                    }
                                });
                            
                                it('should return a Part object for projectSearch', async () => {
                                    const functionCall = { name: 'projectSearch', args: { query: 'AI projects' } };
                                    const result = await handleToolCall(functionCall, mockEnv, {});
                                    // Assert that the result is a Part object and then access its properties
                                    expect(result).toHaveProperty('functionResponse');
                                    const partResult = result as Part;
                                    if (partResult.functionResponse) {
                                        expect(partResult.functionResponse.name).toBe('projectSearch');
                                        expect(partResult.functionResponse.response).toHaveProperty('projects');
                                        const response = partResult.functionResponse.response as { projects: unknown[]; notice?: string };
                                        expect(Array.isArray(response.projects)).toBe(true);
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

    it('should return a 400 Response for a tool call with invalid arguments', async () => {
        const functionCall = { name: 'projectSearch', args: {} }; // Missing 'query' argument
        const result = await handleToolCall(functionCall, mockEnv, {});
        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(400);
    });
});