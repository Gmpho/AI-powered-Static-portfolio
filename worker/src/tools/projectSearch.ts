import { SchemaType } from '@google/generative-ai';
import { projects, Project } from '../projectData'; // Import projects and Project from projectData.ts

// Define the expected environment for the tool functions
interface Env {
    GEMINI_API_KEY: string;
    RATE_LIMIT_KV: KVNamespace;
    PROJECT_EMBEDDINGS_KV: KVNamespace; // Added for project embeddings
}

// Tool function for project search
export async function projectSearch(
    query: string,
    env: Env,
): Promise<Project[]> {
    console.log('projectSearch: Starting search for query:', query);
    const lowerCaseQuery = query.toLowerCase().trim();

    // If the query is empty or a generic term, return all projects.
    const genericQueries = ['project', 'projects', 'work', 'portfolio', 'all', ''];
    if (genericQueries.includes(lowerCaseQuery)) {
        console.log('projectSearch: Generic or empty query detected, returning all projects.');
        return projects;
    }
    
    const keywords = lowerCaseQuery.split(/\s+/).filter(k => k.length > 1);

    // If no valid keywords can be extracted, it's likely a generic request.
    if (keywords.length === 0) {
        console.log('projectSearch: No valid keywords after filtering, returning all projects.');
        return projects;
    }

    const keywordResults = projects.filter(project => {
        const projectText = [
            project.title,
            project.summary,
            project.description,
            ...project.tags
        ].join(' ').toLowerCase();

        // Check if any keyword is present in the project text
        return keywords.some(keyword => projectText.includes(keyword));
    });

    console.log(`projectSearch: Found ${keywordResults.length} projects from keyword search.`);
    
    // L7 Edge Case: If a specific query yields no results, don't leave the user empty-handed.
    // For a portfolio bot, it's better to show something than nothing.
    if (keywordResults.length === 0) {
        console.log('projectSearch: No specific results found, returning all projects as a fallback.');
        return projects;
    }

    return keywordResults;
}


// Schema for the projectSearch tool
export const projectSearchSchema = {
    name: 'projectSearch',
    description: 'Searches for portfolio projects based on a natural language query. Can also be used to list all projects if the query is generic (e.g., "show all projects").',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            query: {
                type: SchemaType.STRING,
                description: 'The natural language query to search for projects. Leave empty to list all projects.',
            },
        },
        required: ['query'],
    },
};
