# AI-Powered Portfolio

An interactive portfolio that leverages the Gemini API to provide a dynamic, conversational experience. This is not just a static portfolio; it's an interactive application where users can chat with an AI assistant to learn more about my work.

## Features

-   **Conversational AI Chatbot:** Interact with an AI assistant powered by the Gemini API.
-   **Project Showcase:** A clean, modern interface to display portfolio projects.
-   **Semantic Project Search:** The AI can search for projects based on natural language queries using vector embeddings generated on the fly.
-   **Interactive Contact Form:** The chatbot can display a contact form for users to get in touch.
-   **Conversation Persistence:** Chat history is saved to `localStorage`, allowing users to continue their conversation across sessions.
-   **Voice Input:** Includes voice-to-text functionality using the Web Speech API.
-   **Light/Dark Mode:** A theme toggle for user preference.

## Technology Stack

-   **Frontend**: TypeScript, HTML5, CSS3 (No framework)
-   **AI Layer**: Google Gemini API via `@google/genai` SDK
-   **Speech Recognition**: Web Speech API

## Quick Start

This project is a client-side-only application.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-powered-portfolio.git
    cd ai-powered-portfolio
    ```

2.  **Set up Environment Variables:**
    This project uses Vite, which handles environment variables. Create a `.env.local` file in the root of the project.
    
    Then, add your Gemini API key to this file. **This key will be exposed on the client-side and is for development purposes only.**
    
    ```
    VITE_API_KEY=YOUR_GEMINI_API_KEY
    ```

3.  **Run the application:**
    You will need a local web server to run the application. If you have Node.js installed, you can use a simple tool like `vite`.
    ```bash
    # Install Vite
    npm install -g vite
    
    # Run the dev server
    vite
    ```

## Docker

This project includes a multi-stage `Dockerfile` for creating a lightweight, production-ready container.

**Build the image:**
```bash
# Note: You must pass your API key as a build argument.
docker build --build-arg VITE_API_KEY="YOUR_GEMINI_API_KEY" -t ai-portfolio .
```

**Run the container:**
```bash
docker run -p 8080:80 ai-portfolio
```
The application will be available at `http://localhost:8080`.
