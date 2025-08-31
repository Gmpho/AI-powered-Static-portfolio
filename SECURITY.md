# Security Principles

Security is a foundational principle of this application's architecture, enforced by the Model Control Plane (MCP) and a set of strict rules.

## 1. Zero API Key Exposure in Frontend

-   **Rule:** Never expose API keys (for Gemini, Pinecone, Notion, etc.) in the frontend code.
-   **Implementation:** All communication with external services that require authentication MUST go through a serverless proxy endpoint (e.g., `/api/*`). The MCP Server, running on the backend, is responsible for securely managing and using these keys. The client-side application has no access to them.

## 2. Mandatory Input/Output Validation

-   **Rule:** All input and output schemas for every tool must be validated with Zod before execution and before being sent in a response.
-   **Implementation:** The MCP Server is responsible for this validation. If a request to a tool does not match the Zod input schema, it is rejected immediately. This prevents a wide range of injection attacks and unexpected behavior.

## 3. Restricted API Key Scopes

-   **Rule:** Use HTTP Referrer restrictions on Gemini API keys (and similar features on other services) whenever possible.
-   **Implementation:** In the Google Cloud console, the Gemini API key should be configured to only accept requests originating from the domain of the deployed backend proxy functions. This adds an extra layer of security, ensuring that even if the key were somehow leaked, it would be useless outside of the application's backend.

## 4. Graceful Error Handling

-   **Rule:** If a tool fails, it must return a structured error message (`{ status: "failed", error: string }`) and not crash the server.
-   **Implementation:** All tool execution logic within the MCP server is wrapped in `try...catch` blocks to handle unexpected failures gracefully, preventing stack traces or sensitive error information from being leaked to the client.
