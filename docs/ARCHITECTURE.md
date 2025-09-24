# 🏗️ Application Architecture

This document outlines the architecture of the AI-Powered Portfolio. The current implementation is a **client-side, single-page application (SPA)** that interacts with the Google Gemini API via a secure Cloudflare Worker proxy.

## Diagram

The diagram below is an inline Mermaid flowchart so GitHub renders it natively. An SVG fallback (`Architecturemd.svg`) is kept in the repo for tools that prefer a static image.

```mermaid
flowchart LR
    %% Nodes
    subgraph Browser [Browser — Vite SPA]
        A[Vite SPA — Client-side SPA]
    end

    subgraph Cloudflare [Cloudflare]
        B[Worker — API Proxy & Auth]
        C[KV — RATE_LIMIT_KV (optional)]
    end

    subgraph GoogleCloud [Google Cloud]
        D[Gemini API — Generative Models]
    end

    %% Connections
    A -->|POST /chat| B
    B -->|Enforce rate limits & auth| C
    B -->|generateContent / embeddings| D
    D -->|{ response }| B
    B -->|JSON response| A

    %% Styling
    classDef browser fill:#E8F6FF;stroke:#1E90FF;stroke-width:1.5px;color:#03396c;
    classDef cloud fill:#E8FFF2;stroke:#05A678;stroke-width:1.5px;color:#064a33;
    classDef kv fill:#FFF8E8;stroke:#FF9F1C;stroke-width:1px;color:#7a4a00;
    classDef google fill:#FFF4E6;stroke:#FF8C42;stroke-width:1.5px;color:#663300;

    class A browser;
    class B cloud;
    class C kv;
    class D google;

    linkStyle default stroke:#9aaed8;stroke-width:1px;
```

If you prefer a static image, the repository also includes `Architecturemd.svg` (kept for compatibility with tools that don't render Mermaid).


## Layers

### 🎨 Presentation Layer (UI)

- **Technologies:** Vanilla TypeScript, HTML, CSS.
    - **HTML Templating:** HTML structures are created using JavaScript template literals within `.ts` files for dynamic content.
- **Responsibilities:** Renders the main portfolio page, including the header, hero section, and project cards. It also provides the user interface for the chatbot, including the chat window, message history, and input form. All UI manipulation is handled directly via the DOM.

### 🧠 Application Logic Layer (Client-Side)

- **Technologies:** TypeScript.
- **Responsibilities:** This is the core of the application, running entirely in the user's browser.
    - **State Management:** Manages the application state, such as the conversation history.
    - **AI Integration:** Handles communication with the Cloudflare Worker, which securely calls the Google Gemini API directly.
    - **Orchestration Logic:** Contains the logic to interpret user intent. Based on keywords (e.g., "search," "contact"), it decides whether to perform a semantic search, display the contact form, or engage in a general conversation.
    - **Data Persistence:** Uses the browser's `localStorage` to save and load the chat history, allowing conversations to persist between sessions.

### 💾 Data Layer

- **Project Data:** Project information is currently hardcoded as a constant within the `index.tsx` file.
- **Conversation History:** Stored in a JavaScript array in memory during the session and persisted to `localStorage`.
- **Vector Embeddings:** Project embeddings for semantic search are generated at runtime when the application loads and are stored in memory.

### ☁️ Infrastructure & Deployment

- **Technologies:** Docker, Nginx, GitHub Pages, Cloudflare Workers.
- **Responsibilities:**
    - **Docker:** The application includes a multi-stage `Dockerfile` for containerization. This creates a production-ready image by building the static assets and serving them from a lightweight Nginx container. This ensures a small, secure, and efficient deployment.
    - **GitHub Pages:** The application is configured for automated deployment to GitHub Pages via GitHub Actions.
    - **Cloudflare Workers:** The AI backend, responsible for securely interacting with the Gemini API, is deployed as a Cloudflare Worker.

