# 🚀 From Direct API Calls to a Control Plane

The initial architecture of this application involved direct, client-side calls to the Gemini API. While simple for development, this approach had limitations in security and scalability. The project has since introduced a basic backend layer using a **Cloudflare Worker**, which serves as a foundational **Model Control Plane (MCP)**.

## 🔒 Previous Architecture: Direct API Access

### Diagram

```mermaid
graph TD
    A[Frontend] <--> B[Google Gemini API];
```

- **👍 Pros:** Simple to set up, no backend infrastructure required.
- **👎 Cons:**
  - **Insecure:** The API key was exposed on the client side.
  - **Limited:** Could not securely connect to other tools or services (like a database or a private API).
  - **Brittle:** Complex logic for choosing between different actions (like search vs. chat) lived on the client and could become difficult to manage.

## ☁️ Current Architecture: Cloudflare Worker as Model Control Plane (MCP)

### Diagram

```mermaid
graph TD
    A[Frontend] <--> B{Cloudflare Worker} <--> C[Google Gemini API];
    B --> D[Embedding API];
    B --> F[Tools Orchestration];
```

- **👍 Pros:**
  - **Secure:** API key is now securely stored and managed by the Cloudflare Worker.
  - **Scalable:** Offloads AI processing (chat and embedding generation) from the client.
  - **Flexible:** Provides a secure endpoint for tool orchestration, with the LLM now deciding which tools to call.
- **👎 Cons:**
  - Further enhancements can be made to fully realize a comprehensive MCP (e.g., advanced monitoring, dynamic tool registration).

## ☁️ Future Architecture: Evolving the Backend Control Plane

Many of the core responsibilities of an intelligent MCP have now been implemented within the Cloudflare Worker. This section now outlines further evolution.

### Diagram

```mermaid
graph TD
    A[Frontend] <--> B{Backend Server (Control Plane)};
    B <--> C[Gemini API];
    B <--> D[Other Tools];
    B <--> E[Databases];
```

### ✅ Core Responsibilities of a Backend Control Plane (Largely Implemented)

1.  **Secure API Gateway:**
    - The primary role of the backend is to act as a secure gateway. The frontend communicates only with your backend server. The backend, running in a secure environment, is responsible for making calls to external services like the Gemini API.
    - This design ensures that sensitive API keys are never exposed on the client-side.

2.  **Tool Orchestration:**
    - The backend now effectively manages and orchestrates a suite of tools. The user prompt is sent to the backend, and the backend, with the help of the Gemini model, determines the user's intent and decides which tool (e.g., database query, search API call) to execute.

3.  **Decoupling and Scalability:**
    - By using a backend, the frontend is completely decoupled from the application logic. New tools or complex workflows can be added to the backend without requiring any changes to the frontend code. This makes the application highly modular and scalable.
