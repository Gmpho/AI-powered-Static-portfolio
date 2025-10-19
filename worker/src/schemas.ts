import { z } from 'zod';

/**
 * Defines the schema for the incoming request to the /chat endpoint.
 * This schema enforces type safety and validation rules for chat messages.
 */
export const chatRequestSchema = z.object({
    /**
     * The user's message or prompt to the AI.
     */
    prompt: z.string().min(1, { message: 'Prompt cannot be empty.' }).max(1200, { message: 'Prompt cannot exceed 1200 characters.' }),
    /**
     * The persona to use for the AI's response. This is optional.
     */
    persona: z.string().optional(),
});

/**
 * Defines the schema for the incoming request to the /contact endpoint.
 * This schema enforces type safety and validation rules for contact form submissions.
 */
export const contactFormSchema = z.object({
    name: z.string().min(1, { message: 'Name cannot be empty.' }).max(100, { message: 'Name cannot exceed 100 characters.' }),
    email: z.string().email({ message: 'Invalid email address.' }).max(255, { message: 'Email cannot exceed 255 characters.' }),
    message: z.string().min(1, { message: 'Message cannot be empty.' }).max(1000, { message: 'Message cannot exceed 1000 characters.' }),
});
