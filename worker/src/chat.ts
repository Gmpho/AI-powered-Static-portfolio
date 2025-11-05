import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkGuardrails } from './guardrails';
import { handleToolCall } from './handleToolCall';
import { projectSearchSchema } from './tools/projectSearch';
import { displayContactFormSchema } from './tools/displayContactForm';
import { sanitizeOutput } from './security-utils';
import { createErrorResponse, Env, withRetries } from './index';
import { ChatEndpointRequestSchema } from './schemas';

// Define the structure of the chat request from the frontend.
interface ChatRequest {
	prompt?: string;
	history?: any[];
}

export async function handleChat(request: Request, env: Env, corsHeaders: HeadersInit, securityHeaders: HeadersInit): Promise<Response> {
    if (request.method !== 'POST') {
        return createErrorResponse('Method Not Allowed', 405, corsHeaders, securityHeaders);
    }

    // Diagnostic logging for Gemini configuration
    console.log('GEMINI_API_KEY present:', !!env.GEMINI_API_KEY);
    console.log('GEMINI_SYSTEM_PROMPT present:', !!env.GEMINI_SYSTEM_PROMPT);

    try {
        const requestBody = await request.json();
        const validationResult = ChatEndpointRequestSchema.safeParse(requestBody);

        if (!validationResult.success) {
            return createErrorResponse(`Invalid request body: ${JSON.stringify(validationResult.error.flatten().fieldErrors)}`, 400, corsHeaders, securityHeaders);
        }

        const { prompt, history = [] } = validationResult.data;

        if (checkGuardrails(prompt)) {
            return createErrorResponse('I am sorry, I cannot process that request.', 400, corsHeaders, securityHeaders);
        }

        if (!env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing from environment');
            return createErrorResponse('Server configuration error: Gemini API key not configured', 500, corsHeaders, securityHeaders);
        }

        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: env.GEMINI_SYSTEM_PROMPT,
            tools: [{
                functionDeclarations: [projectSearchSchema, displayContactFormSchema],
            }],
        });

        const chat = model.startChat({ history });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    const result = await withRetries(() => chat.sendMessageStream(prompt));

                    for await (const chunk of result.stream) {
                        const functionCall = chunk.candidates?.[0]?.content?.parts?.[0]?.functionCall;

                        if (functionCall) {
                            // If the tool is `displayContactForm`, send the command and end the stream.
                            if (functionCall.name === 'displayContactForm') {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ toolCall: { name: 'displayContactForm' } })}\n\n`));
                                break; // End the stream here.
                            }

                            const toolResult = await handleToolCall(functionCall, env, corsHeaders);
                            if (toolResult instanceof Response) {
                                console.warn("handleToolCall returned a direct Response, which cannot be processed in the current streaming implementation.");
                                controller.enqueue(encoder.encode(`event: error\ndata: {"error": "Tool returned a direct response, which is not supported in streaming mode."}\n\n`));
                                break;
                            }
                            
                            // Send tool result back to the model and stream its response
                            const result2 = await withRetries(() => chat.sendMessageStream([toolResult]));
                            for await (const chunk2 of result2.stream) {
                                const text = chunk2.text();
                                const sanitizedText = sanitizeOutput(text);
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: sanitizedText })}

`));
                            }

                        } else {
                            const text = chunk.text();
                            const sanitizedText = sanitizeOutput(text);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: sanitizedText })}

`));
                        }
                    }
                } catch (error) {
                    console.error('Error during chat streaming:', error);
                    controller.enqueue(encoder.encode(`event: error
data: {"error": "An error occurred while processing your request."}

`));
                } finally {
                    controller.enqueue(encoder.encode(`event: completion
data: {}

`));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                ...corsHeaders,
                ...securityHeaders,
            },
        });

    } catch (error) {
        console.error('Error in handleChat:', error);
        return createErrorResponse('Sorry, I’m having trouble processing that right now.', 500, corsHeaders, securityHeaders);
    }
}