import { SchemaType } from '@google/generative-ai';
// worker/src/tools/displayContactForm.ts

// Schema for the displayContactForm tool
/**
 * Zod schema definition for the `displayContactForm` tool.
 * This tool instructs the frontend to display a contact form to the user.
 * It does not require any parameters.
 */
export const displayContactFormSchema = {
    name: 'displayContactForm',
    description: 'Instructs the frontend to display the contact form to the user.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {}, // No parameters needed for this tool
    },
};

// Tool function for displaying the contact form (no-op in worker, just signals frontend)
/**
 * Tool function for displaying the contact form.
 * This function is invoked by the Gemini model to signal the frontend
 * to render a contact form. It performs no direct action in the worker
 * beyond returning a confirmation message.
 * @returns A string indicating that the contact form instruction has been sent.
 */
export async function displayContactForm(): Promise<string> {
    // This function doesn't do anything in the worker, its purpose is to be called by Gemini
    // to signal the frontend to display the contact form.
    return "Contact form display instruction sent to frontend.";
}