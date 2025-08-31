# Gemini API Integration Deep Dive

This document provides a detailed look into how the Google Gemini API is integrated into this portfolio application's architecture.

## 1. Role in the Architecture: The Reasoning Engine

In this project, the Gemini API is not just a text generator; it is the **reasoning engine** or the "brain" of the Portfolio Agent. Its primary role is to interpret a user's natural language query and decide which tool (or sequence of tools) should be used to answer it.

-   **SDK:** `@google/genai`
-   **Model:** `gemini-2.5-flash`. This model is chosen for its excellent balance of performance, speed, and cost-effectiveness, making it ideal for a real-time, tool-choosing agent.

## 2. Secure, Backend-Only Access

A critical aspect of the integration is security. The Gemini API is **only** called from the secure backend environment (the MCP Server or a dedicated serverless proxy function).

**Incorrect (Old Architecture):**
`Frontend Browser -> Google Gemini API`

**Correct (Current Architecture):**
`Frontend Browser -> MCP Server -> Google Gemini API`

This design ensures the `API_KEY` is never exposed to the client-side, following security best practices.

## 3. Prompt Engineering for Tool Use

The prompts sent to the Gemini model are specifically engineered to facilitate tool use. Instead of just asking the model to *answer* a question, the prompt provides the model with:

1.  **The User's Query:** The original question from the user.
2.  **A List of Available Tools:** A description of each tool the agent can use (e.g., `resumeAnalyzer`, `notionQuery`) and what it does.
3.  **Formatting Instructions:** A requirement for the model to respond in a structured format (like JSON) that specifies the tool to call and the parameters to use.

### Example Interaction Flow

1.  **User:** "Can you tell me about the AI Resume Analyzer project?"
2.  **MCP Server to Gemini:** "The user asked: 'Can you tell me about the AI Resume Analyzer project?'. Available tools are: `notionQuery(databaseId, filter)`, `pineconeSearch(...)`. Please respond with the tool to call in JSON format."
3.  **Gemini to MCP Server (Response):** `{ "tool": "notionQuery", "parameters": { "databaseId": "...", "filter": { "name": "AI Resume Analyzer" } } }`
4.  **MCP Server:** The server parses this JSON, validates it with Zod, and executes the `notionQuery` tool with the provided parameters.
