import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import { EmbeddingService } from '../worker/src/services/EmbeddingService';
import { projects } from '../worker/src/projectData';
import { Env } from '../worker/src/index'; // Import Env interface

// This script is intended to be run in a Node.js environment,
// typically as part of a build process or CI/CD pipeline.
// It will generate embeddings for all projects and output wrangler kv:key put commands.

// Minimal Env object for the script's EmbeddingService instantiation.
// Only GEMINI_API_KEY is strictly needed for generateEmbedding.
const scriptEnv: Env = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    // Other Env properties are not directly used by the script's EmbeddingService instance
    // but are required by the Env interface. They can be mocked or left undefined if not accessed.
    ALLOWED_ORIGINS: undefined,
    RATE_LIMIT_KV: {} as KVNamespace,
    PROJECT_EMBEDDINGS_KV: {} as KVNamespace, // Not used for direct KV interaction here, but for type compatibility
};

async function generateAndStoreEmbeddings() {
    if (!scriptEnv.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY environment variable is not set. Exiting.');
        process.exit(1);
    }

    const embeddingService = new EmbeddingService(scriptEnv);

    console.error('Generating embeddings and preparing KV put commands...'); // Use console.error for script logs

    for (const project of projects) {
        const textToEmbed = `${project.title}. ${project.summary}. ${project.description}`;
        try {
            const embedding = await embeddingService.generateEmbedding(textToEmbed);
            const projectId = project.title.replace(/\s+/g, '-').toLowerCase(); // Simple ID from title

            // Output the wrangler command to put the embedding into KV
            // This output will be captured by the CI/CD step and executed.
            // We use --binding and --env production to target the correct KV namespace.
            console.log(`wrangler kv:key put --binding=PROJECT_EMBEDDINGS_KV "${projectId}" '${JSON.stringify(embedding)}' --env production`);

        } catch (error) {
            console.error(`Failed to generate embedding for project: ${project.title}`, error);
            process.exit(1); // Fail the script if embedding generation fails
        }
    }

    console.error('Embedding generation complete. KV put commands printed to stdout.');
}

generateAndStoreEmbeddings().catch(console.error);
