import { SchemaType } from '@google/generative-ai';
import { Env } from '../index';
import { z } from 'zod'; // Import Zod for validation
import { VectorSearchService } from '../services/VectorSearchService';
import { EmbeddingService } from '../services/EmbeddingService';
import { Project, projects } from '../projectData';

// Define a schema for the projectSearch arguments
export const projectSearchArgsSchema = z.object({
    query: z.string().min(1, "Query cannot be empty."),
});
/**
 * Tool function for searching portfolio projects based on a natural language query.
 * It uses semantic search by generating embeddings for the query and comparing them
 * to pre-computed project embeddings stored in KV.
 * @param args The arguments for the tool, validated by projectSearchArgsSchema.
 * @param env The worker's environment variables and KV bindings.
 * @returns An array of matching Project objects, sorted by relevance.
 */
export async function projectSearch(
    args: z.infer<typeof projectSearchArgsSchema>,
    env: Env,
): Promise<{ projects: Project[]; notice?: string }> {
    const { query } = args;
    console.log('projectSearch: Starting combined search for query:', query);

    const embeddingService = new EmbeddingService(env);
    const vectorSearchService = new VectorSearchService();

    // --- Keyword Search (Always runs) ---
    const lowerCaseQuery = query.toLowerCase();
    const queryWords = lowerCaseQuery.split(/\s+/);
    const keywordSearchResults = projects.filter(project => {
        const titleMatch = project.title.toLowerCase().includes(lowerCaseQuery);
        const summaryMatch = project.summary.toLowerCase().includes(lowerCaseQuery);
        const descriptionMatch = project.description.toLowerCase().includes(lowerCaseQuery);
        const tagsMatch = queryWords.some(word => project.tags.some(tag => tag.toLowerCase().includes(word)));

        return titleMatch || summaryMatch || descriptionMatch || tagsMatch;
    });
    console.log(`projectSearch: Found ${keywordSearchResults.length} projects via keyword search.`);

    // --- Semantic Search (Runs if possible) ---
    let semanticSearchResults: Project[] = [];
    let notice: string | undefined;
    try {
        let queryEmbedding = await embeddingService.getProjectEmbedding(`query:${query}`);
        if (!queryEmbedding) {
            queryEmbedding = await embeddingService.generateEmbedding(query);
            if (queryEmbedding) {
                await embeddingService.storeProjectEmbedding(`query:${query}`, queryEmbedding);
            }
        }

        if (queryEmbedding) {
            const allProjectEmbeddingsMap = await embeddingService.getAllProjectEmbeddings();

            if (allProjectEmbeddingsMap.size > 0) {
                const projectMap = new Map<string, Project>();
                projects.forEach(p => projectMap.set(p.id, p));

                const rankedProjects = Array.from(allProjectEmbeddingsMap.entries())
                    .map(([projectId, embedding]) => {
                        const project = projectMap.get(projectId);
                        if (!project) return null;
                        return {
                            project,
                            similarity: vectorSearchService.cosineSimilarity(queryEmbedding, embedding),
                        };
                    })
                    .filter((p): p is { project: Project; similarity: number } => p !== null)
                    .sort((a, b) => b.similarity - a.similarity);

                const similarityThreshold = parseFloat(env.PROJECT_SEARCH_SIMILARITY_THRESHOLD || '0.7');
                const relevantProjects = rankedProjects.filter(rp => rp.similarity > similarityThreshold);

                if (relevantProjects.length > 0) {
                    semanticSearchResults = relevantProjects.map(rp => rp.project);
                } else if (rankedProjects.length > 0) {
                    // Fallback to top 3 if no projects meet the threshold
                    semanticSearchResults = rankedProjects.slice(0, 3).map(rp => rp.project);
                }
            }
            console.log(`projectSearch: Found ${semanticSearchResults.length} projects via semantic search.`);
        } else {
            notice = "Semantic search unavailable (quota exceeded). Showing keyword results only.";
        }
    } catch (error) {
        console.error('projectSearch: Semantic search failed, proceeding with keyword results only:', error);
        notice = "Semantic search unavailable. Showing keyword results only.";
    }

    // --- Combine and Deduplicate Results ---
    const combinedResults = [...semanticSearchResults, ...keywordSearchResults];
    const uniqueResults = Array.from(new Map(combinedResults.map(p => [p.id, p])).values());

    console.log(`projectSearch: Returning ${uniqueResults.length} unique projects.`);
    return { projects: uniqueResults, notice };
}

// Schema for the projectSearch tool
export const projectSearchSchema = {
    name: 'projectSearch',
    description: 'Searches for portfolio projects based on a natural language query using semantic understanding. Returns projects most relevant to the query.',
    parameters: {
        type: SchemaType.OBJECT, // Use string literal for SchemaType.OBJECT
        properties: {
            query: {
                type: SchemaType.STRING, // Use string literal for SchemaType.STRING
                description: 'The natural language query to search for projects (e.g., "AI trading bots", "web development projects").',
            },
        },
        required: ['query'],
    },
};
