# 🏗️ Application Architecture

This document outlines the architecture of the AI-Powered Portfolio. The current implementation is a **client-side, single-page application (SPA)** that interacts directly with the Google Gemini API from the user's browser.

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
    *   **AI Integration:** Initializes the Gemini AI client and handles all communication with the Gemini API. This includes sending user prompts and receiving AI responses.
    *   **Orchestration Logic:** Contains the logic to interpret user intent. Based on keywords (e.g., "search," "contact"), it decides whether to perform a semantic search, display the contact form, or engage in a general conversation.
    *   **Data Persistence:** Uses the browser's `localStorage` to save and load the chat history, allowing conversations to persist between sessions.

### 💾 Data Layer

*   **Project Data:** Project information is currently hardcoded as a constant within the `index.tsx` file.
*   **Conversation History:** Stored in a JavaScript array in memory during the session and persisted to `localStorage`.
*   **Vector Embeddings:** Project embeddings for semantic search are generated at runtime when the application loads and are stored in memory.

### ☁️ Infrastructure & Deployment

*   **Technologies:** Docker, Nginx.
*   **Responsibilities:**
    *   **Docker:** The application includes a multi-stage `Dockerfile` for containerization. This creates a production-ready image by building the static assets and serving them from a lightweight Nginx container. This ensures a small, secure, and efficient deployment.