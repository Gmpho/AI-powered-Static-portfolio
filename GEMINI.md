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
*   **AI Layer**: Google Gemini API (`@google/genai` SDK)
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
    B --> D{Gemini API};
    B --> E[localStorage];
```

## Layers

### 🎨 Presentation Layer (UI)

*   **Technologies:** Vanilla TypeScript, HTML, CSS.
*   **Responsibilities:** Renders the main portfolio page, including the header, hero section, and project cards. It also provides the user interface for the chatbot, including the chat window, message history, and input form. All UI manipulation is handled directly via the DOM.

### 🧠 Application Logic Layer (Client-Side)

*   **Technologies:** TypeScript, `@google/genai` SDK.
*   **Responsibilities:** This is the core of the application, running entirely in the user's browser.
    *   **State Management:** Manages the application state, such as the conversation history.
    *   **AI Integration:** Initializes the Gemini AI client and handles all communication with the Gemini API.
    *   **Orchestration Logic:** Contains the logic to interpret user intent based on keywords.
    *   **Data Persistence:** Uses the browser's `localStorage` to save and load the chat history.

### 💾 Data Layer

*   **Project Data:** Project information is currently hardcoded as a constant within the `index.tsx` file.
*   **Conversation History:** Stored in a JavaScript array in memory during the session and persisted to `localStorage`.
*   **Vector Embeddings:** Project embeddings for semantic search are generated at runtime and stored in memory.

### ☁️ Infrastructure & Deployment

*   **Technologies:** Docker, Nginx, GitHub Pages.
*   **Responsibilities:** The application includes a multi-stage `Dockerfile` for containerization and is configured for automated deployment to GitHub Pages via GitHub Actions.

## 🔐 API Access Model & Security

`Frontend Browser -> Google Gemini API`

> **⚠️ Security Warning:** This client-side approach is suitable for development and demonstration purposes only. It is **not secure for production** because the API key can be extracted from the application's code. For a production environment, all API calls should be routed through a secure backend proxy.

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

An end-to-end (E2E) testing framework like **Playwright** is recommended to validate the entire application workflow.

# 🚀 Getting Started

## Development

1.  **Install dependencies:** `npm install`
2.  **Set up Environment Variables:** Create a `.env.local` file with your `VITE_API_KEY`.
3.  **Run the development server:** `npm run dev`

## Production Build

Run `npm run build` to create a production build in the `dist` directory.

## Docker

Build and run the Docker container using the provided `Dockerfile`.

## Deployment

The portfolio is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch. The deployment process is managed by the `.github/workflows/static.yml` GitHub Actions workflow.

# 📜 Development Conventions

*   **No Framework:** All DOM manipulation is done with plain TypeScript.
*   **JSX for Templating:** JSX is used for templating, but without the React library.
*   **Styling:** CSS is used for styling.
*   **Environment Variables:** Must be prefixed with `VITE_`.
*   **AI Interaction:** Handled in `index.tsx`.
*   **Project Data:** Hardcoded in `index.tsx`.