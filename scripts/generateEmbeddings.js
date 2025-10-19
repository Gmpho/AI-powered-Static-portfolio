import { GoogleGenerativeAI } from '@google/generative-ai';
import { projects } from '../worker/src/projectData.js'; // Add .js extension for ESM
import { config } from 'dotenv';
config({ path: '../.env' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
async function generateEmbeddings() {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    for (const project of projects) {
        const text = `${project.title} ${project.description} ${project.tags.join(' ')}`;
        const result = await model.embedContent(text);
        const embedding = result.embedding.values;
        // In a real application, you would save this embedding to your KV store or vector database.
        // For this example, we'll just log it to the console.
        console.log(`Embedding for ${project.title}:`, embedding);
    }
}
generateEmbeddings();
