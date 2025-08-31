# MCP (Model Control Plane)

The Model Control Plane (MCP) is the core architectural component of this application. It is not a future enhancement but the central nervous system that enables the AI Portfolio Agent to function. It is implemented using the MCP SDK.

## Role in the Architecture

The MCP acts as the intelligent bridge between the client-side application and the complex world of AI models, tools, and external services.

**Current Architecture:**
`Frontend <-> MCP SDK <-> MCP Server <-> [Gemini API, Tools, External Services]`

### Core Responsibilities of the MCP

1.  **Tool Orchestration:**
    -   The primary role of the MCP is to manage and orchestrate a suite of tools (e.g., Pinecone search, Notion queries).
    -   When the frontend sends a user prompt, the MCP Server, in conjunction with the Gemini model, determines the user's intent and decides which tool (or sequence of tools) to execute to fulfill the request.

2.  **Secure API Gateway:**
    -   The MCP server acts as a secure gateway. The frontend communicates with the MCP, and the MCP server, running in a secure backend environment, makes the calls to external services like the Gemini API, Pinecone, etc.
    -   This design ensures that sensitive API keys are never exposed on the client-side.

3.  **Contract Enforcement (with Zod):**
    -   The MCP enforces a strict contract for every tool. It uses Zod schemas to validate all inputs before executing a tool and all outputs before sending a response back to the client. This ensures data integrity and prevents unexpected errors.

4.  **Decoupling Frontend from Backend Logic:**
    -   By using the MCP, the frontend is completely decoupled from the backend business logic. The frontend only needs to know how to talk to the MCP SDK client. New tools or complex workflows can be added to the backend without requiring any changes to the frontend code. This makes the application highly modular and scalable.
