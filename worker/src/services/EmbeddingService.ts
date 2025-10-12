import { GoogleGenerativeAI } from '@google/generative-ai';
import { Env } from '../index'; // Assuming Env is defined in index.ts

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
     */
    public async generateEmbedding(text: string): Promise<number[]> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.EMBEDDING_MODEL });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error('Failed to generate embedding.');
        }
    }

    /**
     * Stores a project embedding in the PROJECT_EMBEDDINGS_KV namespace.
     * @param projectId A unique identifier for the project.
     * @param embedding The embedding vector to store.
     */
    public async storeProjectEmbedding(projectId: string, embedding: number[]): Promise<void> {
        if (!this.env.PROJECT_EMBEDDINGS_KV) {
            console.warn('PROJECT_EMBEDDINGS_KV namespace not found. Cannot store embedding.');
            return;
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
     */
    public async getProjectEmbedding(projectId: string): Promise<number[] | null> {
        if (!this.env.PROJECT_EMBEDDINGS_KV) {
            console.warn('PROJECT_EMBEDDINGS_KV namespace not found. Cannot retrieve embedding.');
            return null;
        }
        try {
            const embeddingString = await this.env.PROJECT_EMBEDDINGS_KV.get(projectId);
            return embeddingString ? JSON.parse(embeddingString) : null;
        } catch (error) {
            console.error(`Error retrieving embedding for project ${projectId}:`, error);
            throw new Error(`Failed to retrieve embedding for project ${projectId}.`);
        }
    }

    /**
     * Retrieves all project embeddings from the PROJECT_EMBEDDINGS_KV namespace.
     * @returns A promise that resolves to a Map where keys are project IDs and values are embedding vectors.
     */
    public async getAllProjectEmbeddings(): Promise<Map<string, number[]>> {
        if (!this.env.PROJECT_EMBEDDINGS_KV) {
            console.warn('PROJECT_EMBEDDINGS_KV namespace not found. Cannot retrieve all embeddings.');
            return new Map();
        }
        try {
            const listResponse = await this.env.PROJECT_EMBEDDINGS_KV.list();
            const embeddingsMap = new Map<string, number[]>();
            for (const key of listResponse.keys) {
                const embedding = await this.getProjectEmbedding(key.name);
                if (embedding) {
                    embeddingsMap.set(key.name, embedding);
                }
            }
            return embeddingsMap;
        } catch (error) {
            console.error('Error retrieving all embeddings:', error);
            throw new Error('Failed to retrieve all embeddings.');
        }
    }

    /**
     * Deletes a project embedding from the PROJECT_EMBEDDINGS_KV namespace.
     * @param projectId The unique identifier for the project to delete.
     */
    public async deleteProjectEmbedding(projectId: string): Promise<void> {
        if (!this.env.PROJECT_EMBEDDINGS_KV) {
            console.warn('PROJECT_EMBEDDINGS_KV namespace not found. Cannot delete embedding.');
            return;
        }
        try {
            await this.env.PROJECT_EMBEDDINGS_KV.delete(projectId);
        } catch (error) {
            console.error(`Error deleting embedding for project ${projectId}:`, error);
            throw new Error(`Failed to delete embedding for project ${projectId}.`);
        }
    }
}
