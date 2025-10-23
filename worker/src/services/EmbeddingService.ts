import { GoogleGenerativeAI } from '@google/generative-ai';
import { Env } from '../index'; // Assuming Env is defined in index.ts

/**
 * Service responsible for generating and managing project embeddings using the Google Gemini API.
 */
export class EmbeddingService {
    private genAI: GoogleGenerativeAI;
    private env: Env;
    private EMBEDDING_MODEL = 'embedding-001';

    constructor(env: Env) {
        this.env = env;
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }

    /**
     * Generates an embedding for the given text using the Gemini embedding model.
     * @param text The text to embed.
     * @returns A promise that resolves to the embedding vector (array of numbers).
     * @throws {Error} If embedding generation fails.
     */
    public async generateEmbedding(text: string): Promise<number[] | null> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.EMBEDDING_MODEL });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error: any) {
            if (error.status === 429) {
                console.warn("Quota exceeded for embedding generation, falling back.");
                return null;
            }
            console.error('Full error during embedding generation:', JSON.stringify(error, null, 2));
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to generate embedding: ${errorMessage}`);
        }
    }

    private validateProjectId(projectId: string): void {
        if (!/^[a-zA-Z0-9-_:]+$/.test(projectId)) {
            throw new Error(`Invalid projectId: ${projectId}`);
        }
    }

    /**
     * Stores a project embedding in the PROJECT_EMBEDDINGS_KV namespace.
     * @param projectId A unique identifier for the project.
     * @param embedding The embedding vector to store.
     * @returns A promise that resolves when the embedding is stored.
     */
    public async storeProjectEmbedding(projectId: string, embedding: number[]): Promise<void> {
        this.validateProjectId(projectId);
        if (!this.env.PROJECT_EMBEDDINGS_KV) {
            throw new Error('PROJECT_EMBEDDINGS_KV namespace not found. Cannot store embedding.');
        }
        try {
            await this.env.PROJECT_EMBEDDINGS_KV.put(projectId, JSON.stringify(embedding));
        } catch (error) {
            console.error(`Error storing embedding for project ${projectId}:`, error);
            throw new Error(`Failed to store embedding for project ${projectId}.`);
        }
    }

    /**
     * Retrieves a project embedding from the PROJECT_EMBEDDINGS_KV namespace.
     * @param projectId The unique identifier for the project.
     * @returns A promise that resolves to the embedding vector or null if not found.
     * @throws {Error} If embedding retrieval fails.
     */
    public async getProjectEmbedding(projectId: string): Promise<number[] | null> {
        this.validateProjectId(projectId);
        if (!this.env.PROJECT_EMBEDDINGS_KV) {
            throw new Error('PROJECT_EMBEDDINGS_KV namespace not found. Cannot retrieve embedding.');
        }
        try {
            const embeddingString = await this.env.PROJECT_EMBEDDINGS_KV.get(projectId);
            if (embeddingString) {
                return JSON.parse(embeddingString) as number[];
            }
            return null;
        } catch (error) {
            console.error(`Error retrieving embedding for project ${projectId}:`, error);
            throw new Error(`Failed to retrieve embedding for project ${projectId}.`);
        }
    }

    /**
     * Retrieves all project embeddings from the PROJECT_EMBEDDINGS_KV namespace.
     * @returns A promise that resolves to a Map where keys are project IDs and values are embedding vectors.
     * @throws {Error} If retrieval of all embeddings fails.
     */
    public async getAllProjectEmbeddings(): Promise<Map<string, number[]>> {
        if (!this.env.PROJECT_EMBEDDINGS_KV) {
            throw new Error('PROJECT_EMBEDDINGS_KV namespace not found. Cannot retrieve all embeddings.');
        }
        try {
            const allEmbeddings = new Map<string, number[]>();
            let cursor: string | undefined = undefined;
            do {
                const listResponse: KVNamespaceListResult<unknown, string> = await this.env.PROJECT_EMBEDDINGS_KV.list({ cursor });
                for (const key of listResponse.keys) {
                    const embeddingString = await this.env.PROJECT_EMBEDDINGS_KV.get(key.name);
                    if (embeddingString) {
                        allEmbeddings.set(key.name, JSON.parse(embeddingString) as number[]);
                    }
                }
                if('cursor' in listResponse && listResponse.cursor) {
                    cursor = listResponse.cursor;
                } else {
                    cursor = undefined;
                }
            } while (cursor);
            return allEmbeddings;
        } catch (error) {
            console.error('Error retrieving all embeddings:', error);
            throw new Error('Failed to retrieve all embeddings.');
        }
    }

    /**
     * Deletes a project embedding from the PROJECT_EMBEDDINGS_KV namespace.
     * @param projectId The unique identifier for the project to delete.
     * @returns A promise that resolves when the embedding is deleted.
     * @throws {Error} If embedding deletion fails.
     */
    public async deleteProjectEmbedding(projectId: string): Promise<void> {
        this.validateProjectId(projectId);
        if (!this.env.PROJECT_EMBEDDINGS_KV) {
            throw new Error('PROJECT_EMBEDDINGS_KV namespace not found. Cannot delete embedding.');
        }
        try {
            await this.env.PROJECT_EMBEDDINGS_KV.delete(projectId);
        } catch (error) {
            console.error(`Error deleting embedding for project ${projectId}:`, error);
            throw new Error(`Failed to delete embedding for project ${projectId}.`);
        }
    }
}
