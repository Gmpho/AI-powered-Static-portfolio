import { z } from 'zod';

/**
 * Defines the schema for the incoming request to the /chat endpoint.
 * This schema enforces type safety and validation rules.
 */
export const chatRequestSchema = z.object({
	/**
	 * The user's prompt. Must be a non-empty string with a maximum length
	 * to prevent overly long (and expensive) requests.
	 */
	prompt: z.string().min(1, { message: 'Prompt cannot be empty.' }).max(1200, { message: 'Prompt cannot exceed 1200 characters.' }),

	/**
	 * The persona to use for the AI's response. This is optional.
	 */
	persona: z.string().optional(),
});
