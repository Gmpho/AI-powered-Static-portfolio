// test-embedding.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testEmbedding() {
  console.log("Running embedding test...");
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const text = "This is a test";
    const result = await model.embedContent(text);
    console.log("Embedding successful:", result.embedding.values);
  } catch (error) {
    console.error("Error during embedding test:", error.message);
  }
}

testEmbedding();