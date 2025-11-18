import { FunctionCall, Part } from '@google/generative-ai';
import { projectSearch, projectSearchArgsSchema } from './tools/projectSearch';
import { Env } from './index';
import { createErrorResponse } from './index';

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
    c: any
): Promise<Part | Response> {
    console.log(`handleToolCall: Received tool call for '${functionCall.name}'`);

    switch (functionCall.name) {
        case 'projectSearch':
            try {
                const parsedArgs = projectSearchArgsSchema.safeParse(functionCall.args);
                if (!parsedArgs.success) {
                    return createErrorResponse(c, `Invalid arguments for projectSearch: ${parsedArgs.error.message}`, 400);
                }
                // Pass the entire parsedArgs.data object to projectSearch
                console.log(`handleToolCall: Calling projectSearch with args:`, parsedArgs.data);
                const searchResults = await projectSearch(parsedArgs.data, env);
                console.log(`handleToolCall: projectSearch returned ${searchResults.projects.length} results.`);

                // Return a Part object containing the tool's output for the model to process.
                return {
                    functionResponse: {
                        name: 'projectSearch',
                        response: {
                            // We wrap the results in a 'projects' property to give the model clear context.
                            projects: searchResults.projects.length > 0 ? searchResults.projects : "No projects found matching your query.",
                            notice: searchResults.notice,
                        },
                    },
                };
            } catch (error: any) {
                console.error('handleToolCall: Error in projectSearch:', error);
                return createErrorResponse(c, `Error during project search: ${error.message || error}`, 500);
            }

        case 'displayContactForm':
            console.log('handleToolCall: Executing displayContactForm.');
            // This tool instructs the frontend. Return a Part object for the model.
            return {
                functionResponse: {
                    name: 'displayContactForm',
                    response: {
                        // The frontend will see this and know to render the form.
                        status: 'success'
                    },
                },
            };

        default:
            console.log(`handleToolCall: Unknown tool '${functionCall.name}'.`);
            return createErrorResponse(c, `Unknown tool: ${functionCall.name}`, 400);
    }
}