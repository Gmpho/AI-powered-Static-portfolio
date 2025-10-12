export class VectorSearchService {

    /**
     * Calculates the cosine similarity between two vectors.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @returns The cosine similarity, a value between -1 and 1.
     */
    public cosineSimilarity(vec1: number[], vec2: number[]): number {
        if (vec1.length !== vec2.length) {
            throw new Error("Vectors must be of the same length.");
        }

        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            magnitude1 += vec1[i] * vec1[i];
            magnitude2 += vec2[i] * vec2[i];
        }

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);

        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0; // Avoid division by zero, return 0 similarity for zero vectors
        }

        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Finds the k nearest neighbors (project IDs) to a query embedding.
     * @param queryEmbedding The embedding of the search query.
     * @param projectEmbeddings A Map where keys are project IDs and values are their embedding vectors.
     * @param k The number of nearest neighbors to return.
     * @returns An array of project IDs, sorted by similarity in descending order.
     */
    public findNearestNeighbors(
        queryEmbedding: number[],
        projectEmbeddings: Map<string, number[]>,
        k: number,
    ): string[] {
        const similarities: { projectId: string; similarity: number }[] = [];

        for (const [projectId, projectEmbedding] of projectEmbeddings.entries()) {
            const similarity = this.cosineSimilarity(queryEmbedding, projectEmbedding);
            similarities.push({ projectId, similarity });
        }

        // Sort by similarity in descending order and take the top k
        similarities.sort((a, b) => b.similarity - a.similarity);

        return similarities.slice(0, k).map((s) => s.projectId);
    }
}
