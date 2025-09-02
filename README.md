# AI-Powered Portfolio 🚀

<!-- Badges -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built With Vite](https://img.shields.io/badge/Built%20With-Vite-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini API](https://img.shields.io/badge/Google%20Gemini%20API-blue?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

An interactive portfolio that leverages the Gemini API to provide a dynamic, conversational experience. This is not just a static portfolio; it's an interactive application where users can chat with an AI assistant to learn more about my work.

## 💡 Problem Solved

Traditional portfolios are static and passive. This project transforms the conventional portfolio into an engaging, interactive experience, allowing visitors to directly query an AI assistant about projects and skills, providing a deeper, more personalized understanding of my work.

## 📖 Table of Contents

*   [✨ Features](#-features)
*   [🛠️ Technology Stack](#️-technology-stack)
*   [🚀 Quick Start](#-quick-start)
*   [🐳 Docker](#-docker)
*   [📸 Visual Demo](#-visual-demo)
*   [🤝 Contributing](#-contributing)
*   [📄 License](#-license)
*   [📞 Contact](#-contact)

## ✨ Features

-   **🤖 Conversational AI Chatbot:** Engage directly with an AI assistant powered by the cutting-edge Gemini API to explore projects and gain insights.
-   **🎨 Dynamic Project Showcase:** A clean, modern interface designed to beautifully present diverse portfolio projects.
-   **🔍 Intelligent Semantic Search:** Leverage AI to semantically search for projects based on natural language queries, providing highly relevant results.
-   **📝 Seamless Contact Integration:** The chatbot can intuitively guide users to an interactive contact form, simplifying communication.
-   **💾 Persistent Conversations:** Chat history is automatically saved to `localStorage`, ensuring continuity across sessions.
-   **🎤 Intuitive Voice Input:** Interact hands-free with the chatbot using integrated voice-to-text functionality via the Web Speech API.
-   **🌗 Adaptive Light/Dark Mode:** Personalize your viewing experience with a toggle for light and dark themes.

## 🛠️ Technology Stack

This project is built with a selection of modern and efficient technologies, chosen for their performance, flexibility, and developer experience.

-   **Frontend**: TypeScript, HTML5, CSS3 (No framework)
-   **AI Layer**: Cloudflare Workers (for secure API proxy), Google Gemini API
-   **Speech Recognition**: Web Speech API

## 🚀 Quick Start

This project is a client-side-only application, designed for easy setup and deployment.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Gmpho/AI-powered-Static-portfolio.git
    cd ai-powered-portfolio
    ```

2.  **Set up Environment Variables:**
    The frontend of this project does not directly use the Gemini API key. All AI interactions are proxied through a Cloudflare Worker for enhanced security. Refer to the `worker/` directory for instructions on setting up the Worker's environment variables.

3.  **Run the application:**
    You will need a local web server to run the application. If you have Node.js installed, you can use a simple tool like `vite`.
    ```bash
    # Install Vite
    npm install -g vite
    
    # Run the dev server
    vite
    ```

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