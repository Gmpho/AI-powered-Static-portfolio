import { SchemaType } from '@google/generative-ai';
// worker/src/tools/displayContactForm.ts

// Schema for the displayContactForm tool
export const displayContactFormSchema = {
    name: 'displayContactForm',
    description: 'Instructs the frontend to display the contact form to the user.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {}, // No parameters needed for this tool
    },
};

// Tool function for displaying the contact form (no-op in worker, just signals frontend)
export async function displayContactForm(): Promise<string> {
    // This function doesn't do anything in the worker, its purpose is to be called by Gemini
    // to signal the frontend to display the contact form.
    return "Contact form display instruction sent to frontend.";
}
