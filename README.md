# AI-Powered Portfolio

An interactive portfolio website featuring an AI chatbot powered by the Gemini API to answer questions about projects. This project showcases the ability to integrate Google's Generative AI into a modern web application to create an engaging and dynamic user experience.

## Features

-   **Interactive AI Chatbot:** Engage with "G.E.M.", an AI assistant powered by the Gemini API, to get information about projects.
-   **Voice Input:** Use your microphone to ask questions with the integrated Web Speech API.
-   **Responsive Design:** A clean, modern, and fully responsive layout that works on all devices.
-   **Dynamic Project Loading:** Project data is managed in JavaScript and rendered dynamically to the page.

## Technology Stack

-   **Frontend:** HTML5, CSS3, TypeScript
-   **AI Integration:** Google Gemini API (`@google/genai`)
-   **Speech Recognition:** Web Speech API (experimental browser feature)

## Quick Start

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-powered-portfolio.git
    cd ai-powered-portfolio
    ```

2.  **Set up your Gemini API Key:**
    This project requires a Google Gemini API key to function. The application is configured to read this key from an environment variable named `API_KEY`.
    
    For local development, your deployment or serving tool must make this variable available to the application. When deploying to a hosting provider like Vercel or Netlify, you will set this in the project's environment variable settings. **Do not hardcode your API key in the code.**

3.  **Serve the application:**
    This application uses ES modules (`import`/`export`) which require it to be served over a local web server to function correctly in the browser. Simply opening the `index.html` file from your file system will not work.

    A simple way to do this is using the VS Code "Live Server" extension or a command-line tool like `serve`.

    ```bash
    # Install serve globally if you don't have it
    npm install -g serve

    # Run the server from the project's root directory
    serve
    ```

4.  Open your browser and navigate to the local URL provided by your server (e.g., `http://localhost:3000`).

## Important Environment Variables

-   `API_KEY`: **(Required)** Your Google Gemini API key. The AI chatbot will not function without this key.

## Folder Map

Here is a breakdown of the key files and their purpose in the project:

-   `index.html`: The main entry point and structure for the web application. It includes the layout for the header, hero section, project display area, and the chatbot widget.
-   `index.css`: Contains all the styling for the application. It uses modern CSS features like custom properties (variables) for easy theming and a responsive design approach.
-   `index.tsx`: The heart of the application, written in TypeScript. This file contains all the client-side logic for:
    -   Initializing the Gemini API and the chat session.
    -   Rendering project cards into the DOM.
    -   Managing all chatbot UI interactions (opening, closing, sending messages).
    -   Handling user input, including text and voice via the Web Speech API.
    -   Communicating with the Gemini API to get AI-generated responses.
-   `metadata.json`: Configuration for the web development environment. It specifies necessary permissions, such as microphone access, required for the speech-to-text feature to work.
-   `README.md`: This file! Your comprehensive guide to understanding, setting up, and running the project.

## Code Documentation

The primary logic in `index.tsx` is documented using JSDoc comments. These comments explain the purpose of major functions, variables, and code blocks, making it easier to understand the flow of the application. Developers are encouraged to read these comments to get a deeper insight into the codebase.

## Deployment

This is a static web application and can be deployed to any static site hosting service. Popular choices include:

-   Vercel
-   Netlify
-   GitHub Pages
-   Cloudflare Pages

When deploying, remember to configure the `API_KEY` as an environment variable in your hosting provider's dashboard to ensure the application functions correctly in production.
