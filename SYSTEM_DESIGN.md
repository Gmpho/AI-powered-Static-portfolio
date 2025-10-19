# System Design: AI-Powered Portfolio

This document provides a definitive, senior-level engineering overview of the application's architecture, security, and operational decisions that constitute a modern, production-grade AI application. orchestration bot

## 1. Core Integration: The Conversational Engine

The Gemini API serves as the **conversational reasoning engine** for the AI Assistant. All natural language understanding and generation capabilities are powered by this integration.

- **SDK:** `@google/genai` (used exclusively on the secure backend).
- **Model:** `gemini-2.0-flash` (for chat), `embedding-001` (for embeddings). These models are strategically chosen for their optimal balance of high performance, low latency, and cost-effectiveness, making them ideal for a real-time, interactive chat application.

## 2. Architectural Pattern: The Secure Backend for Frontend (BFF)

This application employs the industry-standard **Backend for Frontend (BFF)** pattern. All communication with the Gemini API is proxied through a dedicated backend service (a Cloudflare Worker).

**Secure Flow:** `Client Browser -> Cloudflare Worker -> Google Gemini API`

### Rationale for a Decoupled Backend

- **Security:** The Gemini API key is a sensitive secret and must never be exposed client-side. The BFF architecture ensures the key lives and is used only within a trusted server environment.
- **Control:** The backend acts as a control plane, allowing for centralized logic, validation, and orchestration of other services.
- **Abstraction:** The frontend is decoupled from the specific AI provider. The backend could be re-instrumented to call a different model without requiring client-side changes.

### Backend Philosophy: Stateless Execution

The backend is designed to be **stateless**, enhancing scalability and resilience.

1.  **Client-Side History:** The frontend maintains the full conversation history for the user's session.
2.  **Context-on-Demand:** With each new message, the frontend sends the relevant conversation history and project data to the backend.
3.  **Stateless Backend Execution:** The backend treats each request as an independent, self-contained transaction. It does not store any session data.

### Client-Side State Management with `localStorage`

State is managed client-side using `localStorage`.

- **Ephemeral Persistence:** Conversation history is saved to `localStorage` after each message exchange, so a page reload does not erase the conversation.
- **Strategic Choice over `sessionStorage`:** `localStorage` is used to persist chat history across browser sessions, providing a continuous experience for returning users. `sessionStorage` is used for temporary data within a single tab session.

## 3. Architectural Mandate: Code Purity and Performance (.ts vs .tsx)

This project is built with vanilla TypeScript. The deliberate use of the `.ts` file extension over `.tsx` reflects a core architectural philosophy.

- **Semantic Correctness:** The `.tsx` extension is exclusively for codebases that contain JSX. This application uses standard browser DOM APIs (e.g., `document.createElement`, `element.textContent`) for all UI manipulation.
- **Enforcing Purity:** Adhering to `.ts` prevents the accidental introduction of framework-specific syntax, ensuring the project remains a high-performance, zero-dependency application.
- **Optimized Build Pipeline:** This choice allows Vite to apply a more streamlined and faster compilation process compared to files that require JSX transformation.

## 4. Military-Grade Security Architecture: A Defense-in-Depth Approach

Security is a foundational design principle.

- **Zero-Trust API Key Management:** The API key is managed exclusively by the Cloudflare Worker, stored as an encrypted secret and injected at runtime.
- **Proactive Defense Against XSS:** The frontend **never** uses `innerHTML` to render API responses. All content from the LLM is rendered by programmatically creating DOM nodes and setting their `textContent`. This provides the strongest possible defense against XSS attacks by neutralizing any malicious HTML or script tags.
- **Mitigating Prompt Injection:** The backend system prompt is hardcoded within the worker, defining the AI's role and boundaries, making it more resilient to adversarial user inputs.
- **Hardened Network Policies:** The production backend is configured with a strict **Cross-Origin Resource Sharing (CORS)** policy and rate limiting to protect against abuse.
- **Secure SDLC:** The `.gitignore` file is maintained to ensure no secrets, environment files (`.env`), or build artifacts are ever committed to the repository.

## 5. Frontend-Backend API Contract

This section defines the explicit contract for all communication between the frontend client and the backend server.

### Endpoint: `/chat`

- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "prompt": "The user's message to the chatbot.",
    "projects": [
      { "title": "Project Title", "summary": "Project Summary", "description": "Project Description", "tags": ["tag1", "tag2"], "url": "https://example.com/project" }
    ]
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "response": "The generated response from the model."
  }
  ```
- **Error Responses:**
  - **400 Bad Request:** `{"error": "Invalid prompt in request body"}`
  - **429 Too Many Requests:** `{"error": "Too Many Requests"}`
  - **500 Internal Server Error:** `{"error": "Missing server configuration"}`
  - **503 Service Unavailable:** `{"error": "Sorry, I’m having trouble answering that right now."}`

### Endpoint: `/api/generateEmbedding`

- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "text": "The text to generate an embedding for."
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "embedding": [0.123, 0.456, ..., 0.789] // Array of numbers representing the embedding vector
  }
  ```
- **Error Responses:**
  - **400 Bad Request:** `{"error": "Invalid text in request body"}`
  - **429 Too Many Requests:** `{"error": "Too Many Requests"}`
  - **500 Internal Server Error:** `{"error": "Missing server configuration"}`
  - **503 Service Unavailable:** `{"error": "Sorry, I’m having trouble generating the embedding right now."}`

dont for get the toolhandling: Ensure robust error handling, input validation, and clear logging for all tool                    │
│   interactions. Implement retry mechanisms for transient failures and define fallback strategies for critical tool                 │
│   operations. Monitor tool usage and performance metrics to identify and address potential bottlenecks or security                 │
│   vulnerabilities.  