# AI-Powered Portfolio

An interactive portfolio that leverages a sophisticated AI agent to provide dynamic, persuasive, and monetizable user experiences. This is not a static portfolio; it's an AI-powered application that can orchestrate a variety of tools to answer questions, analyze data, and engage with users.

## Features

-   **Conversational AI Agent:** Interact with the "Portfolio Agent," a developer-sidekick powered by the Gemini API and wired into the Model Context Protocol (MCP) SDK.
-   **Tool-Based Architecture:** The agent can use a variety of tools to perform actions, including:
    -   Analyzing resumes.
    -   Searching a vector database (Pinecone) for relevant information.
    -   Querying a content store (Notion) for project details.
    -   Sending contact emails.
-   **Secure & Scalable:** All sensitive API keys are kept on the backend, with the frontend communicating through secure serverless proxy endpoints.
-   **Automated Testing & Deployment:** The entire application is containerized with Docker and uses a CI/CD pipeline with Playwright and Smithery for validation and deployment.

## Technology Stack

-   **Frontend**: LitElement or React (TypeScript, Vite)
-   **AI Layer**: Gemini API via `@google/genai` SDK
-   **Bridge**: MCP SDK (server + client)
-   **Validation**: Zod schemas for every tool input/output
-   **Testing**: Playwright for E2E UI & tool chain validation
-   **Infra**: Docker + Smithery.ai for MCP tool packaging
-   **Deploy**: GitHub Pages (UI) + Netlify/Vercel/Fly.io Functions (secure API proxies)
-   **External Tools**:
    -   Pinecone (vector search / memory)
    -   Notion (content store for projects + docs)

## Quick Start

This project requires both a frontend and a backend (MCP Server) component.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-powered-portfolio.git
    cd ai-powered-portfolio
    ```

2.  **Set up Backend & Environment Variables:**
    The backend consists of the MCP Server and proxy functions for external tools (Pinecone, Notion, Gemini). You will need to configure environment variables for each of these services in your chosen deployment environment (e.g., Netlify, Vercel).
    -   `API_KEY`: Your Google Gemini API key.
    -   `PINECONE_API_KEY`: Your Pinecone API key.
    -   `NOTION_API_KEY`: Your Notion API key.
    -   ...and any other required keys.

3.  **Run the application:**
    The local development environment uses hot-reloading for the MCP tools.
    ```bash
    # (Example commands)
    npm run dev
    ```

4.  **Run Tests:**
    End-to-end tests are run using Playwright.
    ```bash
    npm run test:e2e
    ```
