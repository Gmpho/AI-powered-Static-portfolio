# Application Architecture

This document outlines the architecture of the AI-Powered Portfolio, which is built around the **Model Context Protocol (MCP)** to create a robust, tool-using AI agent.

## Architectural Diagram

The architecture follows a distributed model where the frontend is decoupled from the backend logic and external services. The data flow is as follows:

**Frontend -> AI-Powered Application (MCP SDK) -> Gemini API -> MCP Server -> [Tools: Pinecone, Notion] -> Dockerized Build -> GitHub Pages (CI/CD)**

This can be broken down into the following layers:

### 1. Presentation Layer (Frontend)

-   **Technologies:** LitElement or React (TypeScript, Vite).
-   **Responsibilities:** Provides the user interface for the chat application. It integrates the MCP SDK client to communicate with the backend. It does **not** contain any business logic or sensitive API keys.

### 2. Bridge Layer (MCP SDK)

-   **Technologies:** MCP SDK (client & server).
-   **Responsibilities:**
    -   **Client-side:** Manages the connection to the MCP Server, sending user prompts and receiving responses.
    -   **Server-side:** Acts as the orchestration layer. It receives requests from the client, interprets the user's intent (with help from an LLM like Gemini), and invokes the appropriate tools to fulfill the request.

### 3. Application Logic Layer (MCP Server & Tools)

-   **Technologies:** Node.js, Zod, Docker, Smithery.ai.
-   **Responsibilities:**
    -   **MCP Server:** The core of the backend. It exposes the tool contracts and executes the logic for each tool.
    -   **Tools:** These are individual, validated functions that interact with external services. Examples include querying Pinecone, fetching data from Notion, or analyzing a resume. Each tool has a strict input/output schema defined with Zod for validation.
    -   **Secure Proxies:** All calls to external APIs (Gemini, Pinecone, Notion) are routed through secure serverless proxy endpoints. This ensures API keys are never exposed to the client.

### 4. Infrastructure & Deployment

-   **Technologies:** Docker, Smithery.ai, GitHub Actions, GitHub Pages, Netlify/Vercel.
-   **Responsibilities:**
    -   **Docker:** The entire application, including the MCP server and its tools, is containerized for consistent testing and deployment.
    -   **Smithery:** A tool used to validate that the MCP tool contracts compile correctly with Zod and that the Playwright tests pass within the Docker container.
    -   **CI/CD:** A GitHub Actions pipeline automates the entire process:
        1.  Run Playwright tests.
        2.  Build the Docker image.
        3.  Run Smithery for validation.
        4.  If successful, deploy the static frontend to GitHub Pages and the backend proxy functions to a provider like Netlify or Vercel.
