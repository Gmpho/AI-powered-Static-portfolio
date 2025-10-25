SECURITY NOTE — SYSTEM PROMPT: The system prompt and any model secrets must live only in Cloudflare Worker secrets. They must never be embedded in client code, committed to the repo, or included in PR descriptions.

# 🚀 AI-Powered Portfolio: Project Overview

This is a client-side-only, AI-powered portfolio website. It features a conversational AI chatbot, built with the Google Gemini API, that can answer questions about the projects showcased on the site. The application is built without a major frontend framework, using TypeScript and JSX for templating, and Vite for the build process.

## ✨ Key Features

- **🤖 Conversational AI Chatbot:** Interact with an AI assistant powered by the Gemini API.
- **🎨 Project Showcase:** A clean, modern interface to display portfolio projects.
- **🔍 Semantic Project Search:** The AI can search for projects based on natural language queries.
- **📝 Interactive Contact & Feedback Forms:** The chatbot can display interactive contact and feedback forms for users to get in touch or provide input.
- **🛡️ Client-Side Rate Limiting & Input Validation:** Implemented client-side rate limiting to prevent API abuse and robust input validation to ensure data integrity and security.
- **♿ Enhanced Accessibility:** The chatbot UI now includes ARIA attributes for improved accessibility, ensuring a better experience for all users.
- **🌍 Internationalization (i18n) Ready:** The frontend is now prepared for internationalization, allowing for easy adaptation to multiple languages.
- **💾 Conversation Persistence:** Chat history is saved to `localStorage`.
- **🎤 Voice Input:** Includes voice-to-text functionality using the Web Speech API.
- **⚡ Offline Support (PWA Ready):** The application is configured to register a service worker, laying the groundwork for Progressive Web App (PWA) features like offline access and faster loading.
- **🌗 Light/Dark Mode:** A theme toggle for user preference.

## 🛠️ Technology Stack

- **Frontend**: TypeScript, HTML5, CSS3

- **AI Layer**: Cloudflare Workers, Google Gemini API (`@google/genai` SDK)
- **Gemini Model**: `gemini-2.0-flash`
- **Build Tool**: Vite
- **Speech Recognition**: Web Speech API

# 🏗️ Architecture

The frontend never calls Gemini directly. All AI calls must go through the Cloudflare Worker (Browser → Worker → Gemini) so API keys and the system persona stay server-side.

```mermaid
graph TD
    A[User] --> B{Browser (SPA)};
    B --> C[Static HTML/CSS/JS];
    B --> D{Cloudflare Worker};
    D --> F{Gemini API};
    B --> E[localStorage];
```

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

- **Technologies:** Vanilla TypeScript, HTML, CSS.
- **Responsibilities:** Renders the main portfolio page, including the header, hero section, and project cards. It also provides the user interface for the chatbot, including the chat window, message history, and input form. All UI manipulation is handled directly via the DOM.

### 🧠 Application Logic Layer (Client-Side)

- **Technologies:** TypeScript.
- **Responsibilities:** This is the core of the application, running entirely in the user's browser.
  - **State Management:** Manages the application state, such as the conversation history.
  - **AI Integration:** Handles communication with the Cloudflare Worker, which processes and simplifies the Gemini API's raw response before sending a clean, structured response to the frontend.
  - **Orchestration Logic:** The client-side logic no longer interprets user intent for tool orchestration. Instead, it sends user prompts to the worker, which then handles tool selection and execution via the LLM.
  - **Data Persistence:** Uses the browser's `localStorage` to save and load the chat history.

### 💾 Data Layer

- **Project Data:** Project information is stored in a dedicated `frontend/projects.ts` file, separating it from the UI logic.
- **Conversation History:** Stored in a JavaScript array in memory during the session and persisted to `localStorage`.
- **Vector Embeddings:** Project embeddings for semantic search are generated at runtime and stored in memory.

Resume pipeline: Store resume PDFs in Cloudflare R2. The Worker must extract text server-side, generate a short KV summary for instant display, and create chunked embeddings for semantic retrieval. The frontend receives only the safe summary and a signed download link for the full PDF.

### ☁️ Infrastructure & Deployment

- **Technologies:** Docker, Nginx, GitHub Pages, Cloudflare Workers.
- **Responsibilities:** The application includes a multi-stage `Dockerfile` for containerization and is configured for automated deployment to GitHub Pages via GitHub Actions. The AI backend is deployed as a Cloudflare Worker.

## 🔐 API Access Model & Security

`Frontend Browser -> Cloudflare Worker -> Google Gemini API`

> **✅ Enhanced Security:** The `GEMINI_API_KEY` and `ALLOWED_ORIGINS` are securely stored as **Cloudflare Worker secrets**, preventing their exposure. The `VITE_WORKER_URL` for the frontend is stored as a **GitHub repository secret**. This robust approach is suitable for production environments. The Cloudflare Worker also implements refined guardrails with an adjusted `TRIPWIRE` regex to prevent false positives while maintaining strong protection against sensitive content injection. The Content Security Policy (CSP) has been further hardened to mitigate XSS risks.

- **Injection Detection (Guardrails):** The Worker employs guardrails (`worker/src/guardrails.ts`) to block requests containing sensitive patterns (e.g., `/curl|wget|base64|sk-|api_key=|-----BEGIN/i`) and returns a polite error message, preventing potential code injection or secret exposure. The `TRIPWIRE` regex has been refined for more accurate detection.

# 🤖 The AI Assistant: "AG Gift."

## Persona & Directives

The AI assistant's behavior and personality are defined by a system prompt provided to the Gemini model.

- **Identity:** A witty, tech-savvy, and insightful AI guide.
- **Mission:** To showcase projects in the best possible light and engage visitors.
- **Tone:** Enthusiastic, descriptive, and professional, but with personality.

## 🧠 Prompt Engineering & Logic

The application uses a combination of prompt engineering and worker-side tool orchestration.

1.  **System Prompt:** A detailed system prompt establishes the AI's persona and core directives.
2.  **Conversational History:** The last 5 turns (10 messages) of the conversation are sent with each new prompt to maintain context.
3.  **LLM-Driven Tool Orchestration:** The Cloudflare Worker now leverages Gemini's function calling capabilities. The LLM determines user intent and decides which tool (e.g., project search, contact form) to execute. The worker then handles the tool execution and streams the results back to the frontend.

## 🛠️ Worker-Orchestrated Tools

The application now uses a "tool-based" architecture where the Cloudflare Worker orchestrates tool calls based on LLM decisions.

- **Project Search:** The LLM can trigger a robust project search function via a tool call, performing combined semantic and keyword searches.
- **Contact/Feedback Forms:** The LLM can trigger the display of interactive contact or feedback forms directly in the chat window via a tool call.

# 🛣️ Future Development

## Path to a True Agent

The current implementation is a significant step towards a true agent. The orchestration logic has been shifted from client-side keyword matching to the LLM itself, with the Cloudflare Worker acting as the agent executor.

Memory & Learning: Use session-level memory for short context (in-memory/Durable), and a vetted long-term memory stored as embeddings in a vector DB. New memories must pass human review before being promoted to long-term store.

## Future Architecture: Model Control Plane (MCP)

A more robust, production-ready architecture would introduce a backend layer (MCP) to act as a secure and intelligent bridge between the client and various AI models and tools.

## Recommended CI/CD Pipeline

A CI/CD pipeline (e.g., with GitHub Actions) is recommended for automated building, testing, and deployment.

## Recommended Testing Strategy

While an end-to-end (E2E) testing framework like **Playwright** is used for validating the entire application workflow, the worker itself has a suite of unit and integration tests using **Vitest**. These tests cover the core functionality of the `/chat` endpoint, including rate limiting, API failure handling, and persona logic. All worker unit tests are now passing, ensuring the chatbot's stability.

# 🚀 Getting Started

## Development

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    - In the `frontend` directory, create a `.env.local` file with the following content:
      ```
      VITE_WORKER_URL="http://127.0.0.1:8787"
      ```
    - In the `worker` directory, create a `.dev.vars` file with the following content:
      ```
      GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_KEY_HERE"
      ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
      RATE_LIMIT_KV_ID="YOUR_KV_NAMESPACE_ID_HERE"
      PROJECT_EMBEDDINGS_KV_ID="YOUR_KV_NAMESPACE_ID_HERE"
      ```

3.  **Run the development servers:**
    - In the project root, run:
      ```bash
      npm run dev
      ```

## Production Build

Run `npm run build` to create a production build in the `dist` directory.

## Docker

Build and run the Docker container using the provided `Dockerfile`.

## Deployment

The portfolio is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch. The deployment process is managed by the `.github/workflows/static.yml` GitHub Actions workflow.

### Dynamic Nginx `connect-src` for Worker URL

To ensure the Nginx `Content-Security-Policy`'s `connect-src` directive correctly points to your Cloudflare Worker URL in different environments (e.g., local development, production), the `nginx.conf` has been updated to use a placeholder variable `${WORKER_URL}`.

During Docker build or deployment, you must dynamically inject the actual worker URL into the `nginx.conf`. A common method for this is using `envsubst`.

**Example using `envsubst` in a `Dockerfile` or entrypoint script:**

```dockerfile
# In your Dockerfile, after copying nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Use envsubst to replace the placeholder with the actual environment variable
# Ensure WORKER_URL is set in your build environment or deployment configuration
CMD sh -c "envsubst '\$WORKER_URL' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
```

Ensure the `WORKER_URL` environment variable is correctly set in your CI/CD pipeline or Docker run command.

# 📜 Development Conventions

- **No Framework:** All DOM manipulation is done with plain TypeScript.
  - **HTML Templating:** HTML structures are created using JavaScript template literals within `.ts` files, allowing for dynamic content generation without a frontend framework.
- **Styling:** CSS is used for styling.
- **Environment Variables:** Must be prefixed with `VITE_`.
- **AI Interaction:** Handled in `frontend/chatbot.ts` (via Cloudflare Worker).
- **Project Data:** Located in `frontend/projects.ts`.

# Debugging and Troubleshooting

This section outlines some of the common issues that can be encountered during local development and how to resolve them.

## Worker Not Starting

If you run `npx wrangler dev` from the wrong directory and see a `Missing entry-point` error, it means that Wrangler doesn't know where to find your main worker script.

**Solution:**

1.  Make sure you have a `wrangler.toml` file in your `worker` directory with the following content:

    ```toml
    name = "ai-powered-static-portfolio-worker"
    main = "src/index.ts"
    compatibility_date = "2023-10-30"
    workers_dev = true

    # KV Namespace for rate limiting
    kv_namespaces = [
      { binding = "RATE_LIMIT_KV", id = "YOUR_KV_NAMESPACE_ID" }
    ]

    # CORS configuration
    [vars]
    ALLOWED_ORIGINS = "https://your-github-pages-url,http://localhost:5173,http://127.0.0.1:5173"
    ```

2.  Run the worker from the **root directory** of the project, specifying the path to the worker script:

    ```bash
    npx wrangler dev worker/src/index.ts
    ```

## Chatbot Not Responding (CORS or 404 Errors)

If the chatbot is not responding and you see CORS or 404 errors in your browser's developer console, it could be due to a few reasons:

- **The worker is not running:** Make sure your worker is running correctly by checking the output of the `npx wrangler dev` command.
- **Incorrect `ALLOWED_ORIGINS`:** Make sure the `ALLOWED_ORIGINS` variable in your `worker/.dev.vars` file matches the origin of your frontend application (e.g., `http://localhost:5173`).
- **Incorrect endpoint:** Make sure your frontend is calling the correct endpoint on the worker. In the current implementation, the only endpoint is `/chat`.

## CORS Errors in Production

If you encounter CORS errors (e.g., "Access to fetch... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present") in your production environment, it indicates that your Cloudflare Worker is not sending the correct `Access-Control-Allow-Origin` header.

**Solution:**

This is typically due to an an incorrect value for the `ALLOWED_ORIGINS` secret in your Cloudflare Worker's production environment variables. Ensure the value is set to the exact origin of your GitHub Pages site (e.g., `https://gmpho.github.io`). The browser's CORS policy only considers the scheme and hostname, not the path.

## Chatbot Returns 'Invalid Gemini API Key' or 'Sorry, I’m having trouble answering that right now' Error

If the chatbot returns an error like `{"error":"Sorry, I’m having trouble answering that right now."}` or your health check shows `"geminiKey":"invalid"`, it means there is an issue with your `GEMINI_API_KEY`.

**Solution:**

1.  **Diagnose with the `/health` endpoint:**
    Visit `https://<YOUR_WORKER_URL>/health` in your browser. If the response shows `"geminiKey":"invalid"`, your API key is not configured correctly.

2.  **Set the `GEMINI_API_KEY` Secret:**
    - Go to your [Cloudflare dashboard](https://dash.cloudflare.com) and select **Workers & Pages**.
    - Click on your worker, `ai-powered-static-portfolio-worker`.
    - Go to **Settings** > **Variables**.
    - Under **Environment Variables**, click **Add variable**.
    - Enter `GEMINI_API_KEY` as the **Variable name**.
    - Paste your Gemini API key in the **Value** field.
    - **Important:** Click the **Encrypt** button to save the key as a secret.

3.  **Redeploy the worker:**
    After setting the secret, you must redeploy your worker for the changes to take effect.
    ```bash
    npx wrangler deploy worker/src/index.ts
    ```

## Test Failures

If your worker tests are failing, especially after updating the worker code, it might be due to outdated test files or configuration issues.

**Solution:**

1.  **Outdated Tests:** The boilerplate tests generated by `wrangler init` (e.g., `worker/test/index.spec.ts`) often test generic "Hello World" functionality. If your worker's logic has changed (e.g., to a chatbot), these tests will no longer be relevant and will fail. It's recommended to remove such outdated test files.
2.  **Vitest Configuration:** Ensure your `vitest.config.mts` file correctly points to your `wrangler.toml` configuration (e.g., `wrangler: { configPath: './wrangler.toml' }`).
3.  **Dependency Issues:** If you encounter errors like "Expected Vitest to start running before importing modules" or "Cannot find package", it might indicate dependency conflicts or missing installations. Performing a clean `npm install` in both the root and worker directories (`npm install` and `npm install --prefix worker`) can resolve these.
4.  **No Tests Found:** If you remove all test files and `vitest` exits with an error, you might need to add the `--passWithNoTests` flag to your test command (e.g., `npx vitest --root worker --passWithNoTests`) to allow the test suite to pass when no tests are present.

## 🔒 Security Enhancements: Distributed Rate Limiting

To prevent API abuse and protect Cloudflare Workers, a distributed rate limiting mechanism has been implemented using Cloudflare KV. This solution provides robust protection against rapid, repeated requests from a single IP address across all worker instances.

### How it Works:

- **Mechanism:** Cloudflare KV stores and tracks request timestamps for each client IP address, ensuring a consistent rate limit across all worker instances.
- **Window:** Requests are counted within a `60-second` sliding window.
- **Limit:** A maximum of `10 requests` are allowed per IP address within that window.
- **Response:** If the limit is exceeded, a `429 Too Many Requests` HTTP status code is returned, along with a `Retry-After` header indicating when the client can safely retry.

### Implemented Files:

1.  **`worker/src/rateLimiter.ts`**:
    - Contains the core `checkRateLimit(ip: string)` function.
    - Manages the `requestTimestamps` map.
    - Calculates whether a request is allowed and, if not, the `retryAfter` duration.

2.  **`worker/src/index.ts` (Chat Endpoint):**
    - Imports `checkRateLimit` from `./rateLimiter`.
    - Applies the rate limiting check at the beginning of the `fetch` handler for the `/chat` endpoint.
    - Retrieves the client IP from the `CF-Connecting-IP` header (provided by Cloudflare).

3.  **`worker/src/embed.ts` (Embedding Endpoint):**
    - Imports `checkRateLimit` from `./rateLimiter`.
    - Applies the rate limiting check at the beginning of the `fetch` handler for the `/embed` endpoint.
    - Retrieves the client IP from the `CF-Connecting-IP` header.

### Future Considerations (Distributed Rate Limiting):

For a more robust, production-grade, and distributed rate limiting solution, consider leveraging Cloudflare KV (Key-Value store) as discussed previously. KV allows for shared, persistent counters across all worker instances, providing a more accurate and effective global rate limit.