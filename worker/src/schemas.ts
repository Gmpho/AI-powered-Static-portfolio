import { z } from 'zod';

// Define schemas for various API endpoints and data structures

// Example: Chat message schema
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().min(1, 'Message cannot be empty'),
});

export const ChatRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  messages: z.array(ChatMessageSchema).min(1, 'Messages array cannot be empty'),
  // Add other chat-specific parameters here if needed
});

// Example: Project search schema
export const ProjectSearchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  // Add other search-specific parameters here if needed
});

// Example: Contact form schema
export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(1, 'Message cannot be empty'),
  'cf-turnstile-response': z.string().optional(), // Added for Turnstile
});

export const GenerateEmbeddingRequestSchema = z.object({
  text: z.string().min(1, 'Text for embedding cannot be empty'),
});

export const ChatEndpointRequestSchema = z.object({
    prompt: z.string().min(1, 'Prompt cannot be empty'),
    history: z.array(z.any()).optional(),
});

// Add more schemas as needed for other endpoints and data validation