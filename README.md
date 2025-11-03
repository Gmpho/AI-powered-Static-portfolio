# AI-Powered Portfolio 🚀

<!-- Badges -->

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built With Vite](https://img.shields.io/badge/Built%20With-Vite-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini API](https://img.shields.io/badge/Google%20Gemini%20API-blue?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-206A1E?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![GitHub Pages Deploy](https://img.shields.io/badge/GitHub%20Pages%20Deploy-Deployed-brightgreen?style=flat&logo=github)
[![Cloudflare Worker Deploy](https://img.shields.io/badge/Cloudflare%20Worker-Deployed-orange?style=flat&logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/)

An interactive portfolio that leverages the Gemini API to provide a dynamic, conversational experience. This is not just a static portfolio; it's an interactive application where users can chat with an AI assistant to learn more about my work.

## 💡 Problem Solved

Traditional portfolios are static and passive. This project transforms the conventional portfolio into an engaging, interactive experience, allowing visitors to directly query an AI assistant about projects and skills, providing a deeper, more personalized understanding of my work.

## 📖 Table of Contents

- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ Architecture](#️-architecture)
- [🧪 Testing](#-testing)
- [📚 Documentation](#-documentation)
- [🔐 API Access Model & Security](#-api-access-model--security)
- [🚀 Quick Start](#-quick-start)
- [🐳 Docker](#-docker)
- [📸 Visual Demo](#-visual-demo)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Contact](#-contact)

## ✨ Features

- **🤖 Conversational AI Chatbot:** Engage directly with an AI assistant powered by the cutting-edge Gemini API to explore projects and gain insights.
- **🎨 Dynamic Project Showcase:** A clean, modern interface designed to beautifully present diverse portfolio projects.
- **🔍 Intelligent Semantic Search:** Leverage AI to semantically search for projects based on natural language queries, providing highly relevant results. This now includes a robust keyword fallback and graceful handling of API quota errors, ensuring search functionality remains available and user-friendly.
- **📝 Seamless Contact & Feedback Integration:** The chatbot is designed to intuitively guide users to an interactive contact or feedback form, simplifying communication and gathering valuable insights.
- **🛡️ Enhanced Security:** Implemented security headers for both development (via Vite) and production (via Cloudflare `_headers`) to protect against common web vulnerabilities.
- **⚡ Improved Performance & UI:** Fixed UI bugs, including the 'Flash of Unstyled Content' (FOUC), and optimized the initial page load performance.
- **♿ Enhanced Accessibility:** The chatbot UI now includes ARIA attributes for improved accessibility, ensuring a better experience for all users.
- **🌍 Internationalization (i18n) Ready:** The frontend is now prepared for internationalization, allowing for easy adaptation to multiple languages.
- **💾 Session-based Conversations:** Chat history is automatically saved to `sessionStorage`, ensuring continuity within a single browser tab and clearing upon tab closure. The full conversation history is now sent with each request to the worker, ensuring the AI model maintains context.
- **🎤 Intuitive Voice Input:** The application is designed to allow hands-free interaction with the chatbot using integrated voice-to-text functionality via the Web Speech API. *Note: This feature is planned for future implementation.*
- **⚡ Offline Support (PWA Ready):** The application is configured to register a service worker, laying the groundwork for Progressive Web App (PWA) features like offline access and faster loading.
- **🌗 Adaptive Light/Dark Mode:** Personalize your viewing experience with a toggle for light and dark themes.

## 🛠️ Technology Stack

This project is built with a selection of modern and efficient technologies, chosen for their performance, flexibility, and developer experience.

- **Frontend**: TypeScript, HTML5, CSS3 (No framework, uses JavaScript template literals for HTML templating)
- **AI Layer**: Cloudflare Workers (secure API proxy, distributed KV-backed rate limiting, refined guardrails, embedding generation with caching, calling Google Gemini API directly), Google Gemini API (using `gemini-2.0-flash` model, `embedding-001` model)
- **Testing**: Playwright (for End-to-End testing), Vitest (for Worker unit testing)
- **Speech Recognition**: Web Speech API

# 🏗️ Architecture

The application is a **client-side, single-page application (SPA)** that interacts directly with the Google Gemini API from the user's browser.

## Diagram

For a better viewing experience on GitHub, the diagram is rendered from a `.mmd` file. It includes icons, which require Font Awesome to be available in the rendering environment.

```mermaid
flowchart LR
    subgraph "Browser"
        A[Vite SPA]
    end

    subgraph "Cloudflare"
        B[Worker]
        C[KV RATE_LIMIT_KV]
        G[Guardrails]
        T[Tools]
        E[KV PROJECT_EMBEDDINGS_KV]
    end

    subgraph "Google Cloud"
        D[Gemini API]
    end

    %% Connections
    A -- "POST /chat (prompt, history)" --> B
    A -- "POST /api/generateEmbedding" --> B
    B -- "Auth & Rate Limit" --> C
    B -- "Apply Guardrails" --> G
    G -- "If safe, proceed" --> B
    B -- "generateContent (with tools, history)" --> D
    D -- "response (text/tool_call)" --> B
    B -- "Execute Tool (e.g., projectSearch)" --> T
    T -- "Tool Output (projects, notice)" --> B
    B -- "Cache Query Embedding" --> E
    E -- "Retrieve Project Embeddings" --> T
    B -- "Streaming SSE (text/tool_response)" --> A
```

### Cloudflare Worker Endpoints

The Cloudflare Worker acts as a secure proxy and backend for AI-related functionalities, exposing the following key endpoints:

- `/chat`: Handles conversational requests, forwarding them to the Gemini API, applying rate limiting, and enforcing guardrails to prevent sensitive content injection.
- `/api/generateEmbedding`: Generates vector embeddings for text, also protected by rate limiting and guardrails. This endpoint is designed for internal use by the application (e.g., for semantic search) and not for direct client access.

## Layers

### 🎨 Presentation Layer (UI)

- **Technologies:** Vanilla TypeScript, HTML, CSS.
- **Responsibilities:** Renders the main portfolio page, including the header, hero section, and project cards. It also provides the user interface for the chatbot, including the chat window, message history, and input form. All UI manipulation is handled directly via the DOM.

### 🧠 Application Logic Layer (Client-Side)

- **Technologies:** TypeScript.
- **Responsibilities:** This is the core of the application, running entirely in the user's browser.
  - **State Management:** Manages the application state, such as the conversation history.
  - **AI Integration:** Handles communication with the Cloudflare Worker, which processes and simplifies the Gemini API's raw response before sending a clean, structured response to the frontend.
  - **Orchestration Logic:** Contains the logic to interpret user intent based on keywords.
  - **Data Persistence:** Uses the browser's `localStorage` to save and load the chat history.
  - **Performance Optimization:** The initial page load performance has been optimized to ensure a fast and smooth user experience.

### 💾 Data Layer

- **Project Data:** Project information is sourced from `frontend/projects.ts` and sent with each chat request to the worker.
- **Conversation History:** Stored in a JavaScript array in memory during the session and persisted to `localStorage`.
- **Vector Embeddings:** Project embeddings for semantic search are generated by the Cloudflare Worker (via the `/api/generateEmbedding` endpoint) and cached in frontend memory (`projectEmbeddings`) on application load.

### ☁️ Infrastructure & Deployment

- **Technologies:** Docker, Nginx, GitHub Pages, Cloudflare Workers.
- **Responsibilities:** The application includes a multi-stage `Dockerfile` for containerization and is configured for automated deployment to GitHub Pages via GitHub Actions. The AI backend is deployed as a Cloudflare Worker.

## 🔐 API Access Model & Security

`Frontend Browser -> Cloudflare Worker -> Google Gemini API`

> **✅ Enhanced Security:** The `GEMINI_API_KEY` and `ALLOWED_ORIGINS` are securely stored as **Cloudflare Worker secrets**, preventing their exposure. The `VITE_WORKER_URL` for the frontend is stored as a **GitHub repository secret`. This robust approach is suitable for production environments. The Cloudflare Worker also implements refined guardrails with an adjusted `TRIPWIRE` regex to prevent false positives while maintaining strong protection against sensitive content injection. Security headers have been implemented for both development (via Vite) and production (via Cloudflare `_headers`) to protect against common web vulnerabilities. The Content Security Policy (CSP) has been further hardened to mitigate XSS risks.

## 🧪 Testing

To ensure the reliability and quality of the application, a comprehensive testing strategy is employed:

- **End-to-End (E2E) Testing with Playwright:**
  - Simulates real user interactions in a browser to validate the entire application workflow, including UI, application logic, and API integrations.
  - Covers key scenarios like general conversation, contact form submission, **rate limiting, and guardrail enforcement.** It also includes comprehensive security tests to validate guardrails against various attack scenarios.
  - All E2E tests are currently passing.
  - **To run E2E tests:**
    ```bash
    npx playwright test
    ```
- **Worker Unit Testing with Vitest:**
  - Ensures the individual components and logic of the Cloudflare Worker function correctly.
  - All worker unit tests are currently passing. A critical bug related to the Gemini model was recently identified and fixed, and all tests continue to pass after the resolution, ensuring the chatbot's stability.
  - **To run Worker unit tests:**
    ```bash
    npm test --prefix worker
    ```

## 🚀 Quick Start

1. **Install dependencies:**
   - Run `npm install` in the project root.
   - Run `npm install --prefix worker` in the project root to install worker-specific dependencies.

2. **Set up Environment Variables (Development):**
   - In the `frontend` directory, create a `.env.local` file with the following content:

     ```env
     VITE_WORKER_URL="http://localhost:8787"
     ```

   - In the `worker` directory, create a `.dev.vars` file with the following content:

     ```env
     GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_KEY_HERE"
     ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
     RATE_LIMIT_KV_ID="YOUR_KV_NAMESPACE_ID_HERE"
     PROJECT_EMBEDDINGS_KV_ID="YOUR_KV_NAMESPACE_ID_HERE"
     ```

3. **Set up Environment Variables (Production):**
   - **Cloudflare Worker Secrets:**
     - `GEMINI_API_KEY`: Your Google AI Studio key (set via `npx wrangler secret put GEMINI_API_KEY`).
     - `ALLOWED_ORIGINS`: Your GitHub Pages URL (e.g., `https://gmpho.github.io`) (set via `npx wrangler secret put ALLOWED_ORIGINS`).
     - `RATE_LIMIT_KV_ID`: The ID of your `RATE_LIMIT_KV` namespace (set via `npx wrangler secret put RATE_LIMIT_KV_ID`).
     - `PROJECT_EMBEDDINGS_KV_ID`: The ID of your `PROJECT_EMBEDDINGS_KV` namespace (set via `npx wrangler secret put PROJECT_EMBEDDINGS_KV_ID`).
   - **GitHub Repository Secret:**
     - `VITE_WORKER_URL`: The URL of your deployed Cloudflare Worker (e.g., `https://ai-powered-static-portfolio-worker.<YOUR_ACCOUNT_NAME>.workers.dev`) (set via `gh secret set VITE_WORKER_URL`).

4. **Run the development servers:**
   - In the project root, run:

     ```bash
     npm run dev
     ```

5. **Production Security Headers:**
   - For production deployments on Cloudflare Pages, a `_headers` file is included in the `frontend/public` directory. This file contains security headers that will be automatically applied by Cloudflare.

For detailed troubleshooting, refer to the [Debugging and Troubleshooting](GEMINI.md#debugging-and-troubleshooting) section in `GEMINI.md` and the [Known Issues](docs/KNOWN_ISSUES.md) document for specific resolutions.

## 🐳 Docker

Containerize this application for consistent and isolated environments using Docker.

**Build the image:**

```bash
# The frontend Docker image does not require the API key.
docker build -t ai-portfolio .
```

**Run the container:**

```bash
docker run -p 8080:80 ai-portfolio
```

The application will be available at `http://localhost:8080`.

## 📸 Visual Demo

Experience the interactive AI-powered portfolio in action:

![AI Portfolio Website Mockup](AI%20Portfolio%20Website%20Mockup.png)

## 🤝 Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For questions or feedback, please open an issue or contact me directly.

<!-- Deployed: 2025-09-22 -->
<!-- Trigger re-deployment -->
<!-- Trigger re-deployment 2 -->
<!-- Trigger re-deployment 3 -->