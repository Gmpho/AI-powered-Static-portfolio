# Gemini API Integration Deep Dive

This document provides a detailed look into how the Google Gemini API is integrated into this portfolio application's architecture.

## 1. Role in the Architecture: The Conversational Engine

In this project, the Gemini API is the **conversational engine** of the AI Assistant. Its primary role is to understand user messages within the context of a conversation and generate helpful, relevant, and in-character responses.

-   **SDK:** `@google/genai`
-   **Model:** `gemini-2.5-flash`. This model is chosen for its excellent balance of performance, speed, and cost-effectiveness, making it ideal for a real-time chat application.

## 2. API Access Model: Client-Side

A critical aspect of the integration is how the application accesses the API.

**Current Architecture:**
`Frontend Browser -> Google Gemini API`

In the current implementation, the Gemini API is called **directly from the client-side code** running in the user's browser. The API key is embedded into the application at build time.

> **⚠️ Security Warning:** This client-side approach is suitable for development and demonstration purposes only. It is **not secure for production** because the API key can be extracted from the application's code. For a production environment, all API calls should be routed through a secure backend proxy.

## 3. Prompt Engineering and Logic

The application uses a combination of prompt engineering and client-side logic to function.

1.  **System Prompt:** A detailed system prompt is provided to the Gemini model to establish the AI's persona ("AG Gift."), its core directives, and the project data it can talk about. This guides the tone and content of its conversational responses.

2.  **Conversational History:** To maintain context, the application sends the last 5 turns (10 messages) of the conversation with each new user prompt. This allows the model to remember what was discussed previously and provide coherent follow-up answers.

3.  **Keyword-Based Logic (Not LLM Tool Use):** The application does **not** currently use the LLM to decide which "tool" to use. Instead, it uses simple JavaScript logic to check the user's message for keywords:
    -   If the message contains "search" or "find", the application runs its own semantic search function.
    -   If the message contains "contact" or "message", it displays the contact form.
    -   If neither of these conditions is met, it sends the message to the Gemini API for a standard conversational response.
