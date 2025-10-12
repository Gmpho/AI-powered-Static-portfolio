import { FunctionCall, Part } from '@google/generative-ai';
import { projectSearch } from './tools/projectSearch';
import { Env } from './index';
import { jsonResponse, createErrorResponse } from './index';

/**
 * Handles a function call from the Gemini model.
 *
 * This function can return one of two things:
 * 1. A `Response` object: This is for tools that need to send a direct, final response
 *    to the frontend without further model processing (e.g., `displayContactForm`).
 * 2. A `Part` object: This is for tools that return data that should be sent back
 *    to the model to generate a conversational response (e.g., `projectSearch`).
 */
export async function handleToolCall(
    functionCall: FunctionCall,
    env: Env,
    corsHeaders: HeadersInit
): Promise<Part | Response> {
    console.log(`handleToolCall: Received tool call for '${functionCall.name}'`);

    switch (functionCall.name) {
        case 'projectSearch':
            try {
                const query = (functionCall.args as { query: string })?.query ?? '';
                console.log(`handleToolCall: Calling projectSearch with query: "${query}"`);
                const searchResults = await projectSearch(query, env);
                console.log(`handleToolCall: projectSearch returned ${searchResults.length} results.`);

                // Return a Part object containing the tool's output for the model to process.
                return {
                    functionResponse: {
                        name: 'projectSearch',
                        response: {
                            // We wrap the results in a 'projects' property to give the model clear context.
                            projects: searchResults,
                        },
                    },
                };
            } catch (error: any) {
                console.error('handleToolCall: Error in projectSearch:', error);
                return createErrorResponse(`Error during project search: ${error.message || error}`, 500, corsHeaders);
            }

        case 'displayContactForm':
            console.log('handleToolCall: Executing displayContactForm.');
            // This tool instructs the frontend directly, so we return a final Response.
            return jsonResponse({ toolCall: { name: 'displayContactForm' } }, 200, corsHeaders);

        default:
            console.log(`handleToolCall: Unknown tool '${functionCall.name}'.`);
            return createErrorResponse(`Unknown tool: ${functionCall.name}`, 400, corsHeaders);
    }
}