# 🚀 AI-Powered Portfolio: Project Overview

This is a client-side-only, AI-powered portfolio website. It features a conversational AI chatbot, built with the Google Gemini API, that can answer questions about the projects showcased on the site. The application is built without a major frontend framework, using TypeScript and JSX for templating, and Vite for the build process.

## ✨ Key Features

*   **🤖 Conversational AI Chatbot:** Interact with an AI assistant powered by the Gemini API.
*   **🎨 Project Showcase:** A clean, modern interface to display portfolio projects.
*   **🔍 Semantic Project Search:** The AI can search for projects based on natural language queries.
*   **📝 Interactive Contact Form:** The chatbot can display a contact form for users to get in touch.
*   **💾 Conversation Persistence:** Chat history is saved to `localStorage`.
*   **🎤 Voice Input:** Includes voice-to-text functionality using the Web Speech API.
*   **🌗 Light/Dark Mode:** A theme toggle for user preference.

## 🛠️ Technology Stack

*   **Frontend**: TypeScript, HTML5, CSS3




*   **AI Layer**: Cloudflare Workers, Google Gemini API (`@google/genai` SDK)
*   **Gemini Model**: `gemini-2.5-flash`
*   **Build Tool**: Vite
*   **Speech Recognition**: Web Speech API

# 🏗️ Architecture

The application is a **client-side, single-page application (SPA)** that interacts directly with the Google Gemini API from the user's browser.

## Diagram

```mermaid
graph TD
    A[User] --> B{Browser (SPA)};
    B --> C[Static HTML/CSS/JS];
    B --> D{Cloudflare Worker};
    D --> F{Gemini API};
    B --> E[localStorage];
```

## Layers

### 🎨 Presentation Layer (UI)

*   **Technologies:** Vanilla TypeScript, HTML, CSS.
*   **Responsibilities:** Renders the main portfolio page, including the header, hero section, and project cards. It also provides the user interface for the chatbot, including the chat window, message history, and input form. All UI manipulation is handled directly via the DOM.

### 🧠 Application Logic Layer (Client-Side)

*   **Technologies:** TypeScript.
*   **Responsibilities:** This is the core of the application, running entirely in the user's browser.
    *   **State Management:** Manages the application state, such as the conversation history.
    *   **AI Integration:** Handles communication with the Cloudflare Worker, which processes and simplifies the Gemini API's raw response before sending a clean, structured response to the frontend.
    *   **Orchestration Logic:** Contains the logic to interpret user intent based on keywords.
    *   **Data Persistence:** Uses the browser's `localStorage` to save and load the chat history.

### 💾 Data Layer

*   **Project Data:** Project information is currently hardcoded as a constant within the `index.tsx` file.
*   **Conversation History:** Stored in a JavaScript array in memory during the session and persisted to `localStorage`.
*   **Vector Embeddings:** Project embeddings for semantic search are generated at runtime and stored in memory.

### ☁️ Infrastructure & Deployment

*   **Technologies:** Docker, Nginx, GitHub Pages, Cloudflare Workers.
*   **Responsibilities:** The application includes a multi-stage `Dockerfile` for containerization and is configured for automated deployment to GitHub Pages via GitHub Actions. The AI backend is deployed as a Cloudflare Worker.

## 🔐 API Access Model & Security

`Frontend Browser -> Cloudflare Worker -> Google Gemini API`

> **✅ Enhanced Security:** The `GEMINI_API_KEY` and `ALLOWED_ORIGINS` are securely stored as **Cloudflare Worker secrets**, preventing their exposure. The `VITE_WORKER_URL` for the frontend is stored as a **GitHub repository secret**. This robust approach is suitable for production environments.

# 🤖 The AI Assistant: "AG Gift."

## Persona & Directives

The AI assistant's behavior and personality are defined by a system prompt provided to the Gemini model.

*   **Identity:** A witty, tech-savvy, and insightful AI guide.
*   **Mission:** To showcase projects in the best possible light and engage visitors.
*   **Tone:** Enthusiastic, descriptive, and professional, but with personality.

## 🧠 Prompt Engineering & Logic

The application uses a combination of prompt engineering and client-side logic.

1.  **System Prompt:** A detailed system prompt establishes the AI's persona and core directives.
2.  **Conversational History:** The last 5 turns (10 messages) of the conversation are sent with each new prompt to maintain context.
3.  **Keyword-Based Logic:** The application uses simple JavaScript logic to check for keywords to decide which "tool" to use.

## 🛠️ Simulated Tool Contracts (Frontend)

The application simulates a "tool-based" architecture within the frontend code.

*   **Project Metadata:** Fetches metadata about all portfolio projects.
*   **Contact Email:** Simulates sending a contact email and displays a contact form.

# 🛣️ Future Development

## Path to a True Agent

The current implementation is not a true agent. To evolve this project into a true agent architecture, the orchestration logic would need to be shifted from the client-side code to the LLM itself.

## Future Architecture: Model Control Plane (MCP)

A more robust, production-ready architecture would introduce a backend layer (MCP) to act as a secure and intelligent bridge between the client and various AI models and tools.

## Recommended CI/CD Pipeline

A CI/CD pipeline (e.g., with GitHub Actions) is recommended for automated building, testing, and deployment.

## Recommended Testing Strategy

While an end-to-end (E2E) testing framework like **Playwright** is recommended for validating the entire application workflow, it's important to note that the initial boilerplate tests for the worker have been removed as they did not align with the current application logic. New, relevant unit and integration tests for the `/chat` endpoint should be written to ensure the worker's functionality is thoroughly covered.

# 🚀 Getting Started

## Development

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    *   In the `frontend` directory, create a `.env.local` file with the following content:
        ```
        VITE_WORKER_URL="http://127.0.0.1:8787"
        ```
    *   In the `worker` directory, create a `.dev.vars` file with the following content:
        ```
        GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_KEY_HERE"
        ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
        ```

3.  **Run the development servers:**
    *   In one terminal, start the frontend server:
        ```bash
        npm run dev
        ```
    *   In a second terminal, start the worker server from the root directory of the project:
        ```bash
        npx wrangler dev worker/src/index.ts
        ```

## Production Build

Run `npm run build` to create a production build in the `dist` directory.

## Docker

Build and run the Docker container using the provided `Dockerfile`.

## Deployment

The portfolio is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch. The deployment process is managed by the `.github/workflows/static.yml` GitHub Actions workflow.

# 📜 Development Conventions

*   **No Framework:** All DOM manipulation is done with plain TypeScript.
    *   **HTML Templating:** HTML structures are created using JavaScript template literals within `.ts` files, allowing for dynamic content generation without a frontend framework.
*   **Styling:** CSS is used for styling.
*   **Environment Variables:** Must be prefixed with `VITE_`.
*   **AI Interaction:** Handled in `frontend/chatbot.ts` (via Cloudflare Worker).
*   **Project Data:** Hardcoded in `index.tsx`.

#  Debugging and Troubleshooting

This section outlines some of the common issues that can be encountered during local development and how to resolve them.

## Worker Not Starting

If you run `npx wrangler dev` from the wrong directory and see a `Missing entry-point` error, it means that Wrangler doesn't know where to find your main worker script.

**Solution:**

1.  Make sure you have a `wrangler.toml` file in your `worker` directory with the following content:

    ```toml
    name = "ai-powered-static-portfolio-worker"
    main = "src/index.ts"
    compatibility_date = "2023-10-30"
    ```

2.  Run the worker from the **root directory** of the project, specifying the path to the worker script:

    ```bash
    npx wrangler dev worker/src/index.ts
    ```

## Chatbot Not Responding (CORS or 404 Errors)

If the chatbot is not responding and you see CORS or 404 errors in your browser's developer console, it could be due to a few reasons:

*   **The worker is not running:** Make sure your worker is running correctly by checking the output of the `npx wrangler dev` command.
*   **Incorrect `ALLOWED_ORIGINS`:** Make sure the `ALLOWED_ORIGINS` variable in your `worker/.dev.vars` file matches the origin of your frontend application (e.g., `http://localhost:5173`).
*   **Incorrect endpoint:** Make sure your frontend is calling the correct endpoint on the worker. In the current implementation, the only endpoint is `/chat`.

## CORS Errors in Production

If you encounter CORS errors (e.g., "Access to fetch... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present") in your production environment, it indicates that your Cloudflare Worker is not sending the correct `Access-Control-Allow-Origin` header.

**Solution:**

This is typically due to an incorrect value for the `ALLOWED_ORIGINS` secret in your Cloudflare Worker's production environment variables. Ensure the value is set to the exact origin of your GitHub Pages site (e.g., `https://gmpho.github.io`). The browser's CORS policy only considers the scheme and hostname, not the path.

## Test Failures

If your worker tests are failing, especially after updating the worker code, it might be due to outdated test files or configuration issues.

**Solution:**

1.  **Outdated Tests:** The boilerplate tests generated by `wrangler init` (e.g., `worker/test/index.spec.ts`) often test generic "Hello World" functionality. If your worker's logic has changed (e.g., to a chatbot), these tests will no longer be relevant and will fail. It's recommended to remove such outdated test files.
2.  **Vitest Configuration:** Ensure your `vitest.config.mts` file correctly points to your `wrangler.toml` configuration (e.g., `wrangler: { configPath: './wrangler.toml' }`).
3.  **Dependency Issues:** If you encounter errors like "Expected Vitest to start running before importing modules" or "Cannot find package", it might indicate dependency conflicts or missing installations. Performing a clean `npm install` in both the root and worker directories (`npm install` and `npm install --prefix worker`) can resolve these.
4.  **No Tests Found:** If you remove all test files and `vitest` exits with an error, you might need to add the `--passWithNoTests` flag to your test command (e.g., `npx vitest --root worker --passWithNoTests`) to allow the test suite to pass when no tests are present.