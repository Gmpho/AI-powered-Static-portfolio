# Application Architecture

This document outlines the architecture of the AI-Powered Portfolio, a client-side web application with an integrated AI chatbot.

## Overview

The application follows a simple, modern frontend architecture. It is a static single-page application (SPA) where all logic runs in the user's browser. The architecture can be broken down into three main layers:

1.  **Presentation Layer (UI):** The user interface, built with HTML and styled with CSS.
2.  **Application Logic Layer:** The core logic, written in TypeScript, which manages the UI, user interactions, and state.
3.  **Service Layer:** The communication layer that interacts with external APIs, primarily the Google Gemini API.

## Architectural Diagram

For a visual representation of the architecture, please see the Mermaid diagram in [`architecture.mmd`](./architecture.mmd).

## Layer Breakdown

### 1. Presentation Layer

-   **Technologies:** HTML5, CSS3
-   **Responsibilities:**
    -   Provides the structural markup for the entire application (`index.html`).
    -   Defines the visual appearance, responsiveness, and theming (light/dark modes) of the application (`index.css`).
    -   Uses semantic HTML and ARIA attributes for accessibility.

### 2. Application Logic Layer

-   **Technologies:** TypeScript
-   **File:** `index.tsx`
-   **Responsibilities:**
    -   **DOM Manipulation:** Dynamically renders project cards and chat messages.
    -   **Event Handling:** Manages all user interactions, such as button clicks (opening the chat, sending messages, toggling the theme) and form submissions.
    -   **State Management:** Implicitly manages the application's state, such as the visibility of the chat window, the content of the chat input, and the conversation history within the DOM.
    -   **Speech Recognition:** Interfaces with the browser's Web Speech API to handle voice input.
    -   **Orchestration:** Acts as the central controller, delegating tasks between the UI and the Service Layer. For example, when a user sends a message, this layer updates the UI, calls the Service Layer to get a response, and then updates the UI again with the AI's message.

### 3. Service Layer

-   **Technologies:** `@google/genai` SDK
-   **File:** Integrated within `index.tsx` (in functions like `initializeAI` and `handleChatSubmit`).
-   **Responsibilities:**
    -   **API Abstraction:** Encapsulates the logic for communicating with the Google Gemini API.
    -   **AI Initialization:** Configures and initializes the `GoogleGenAI` client and the `Chat` session, including setting the crucial system instruction.
    -   **Data Fetching:** Manages the asynchronous `sendMessage` calls to the Gemini API.
    -   **Error Handling:** Implements `try...catch` blocks to gracefully handle potential API errors and provides user-friendly feedback.

## Data Flow: A User's Chat Message

1.  **User Action:** The user types a message and clicks "Send" or uses the microphone.
2.  **Event Listener (Logic Layer):** The `submit` event on the chat form is triggered.
3.  **UI Update (Logic Layer):** The `handleChatSubmit` function immediately adds the user's message to the chat window and displays a loading indicator.
4.  **API Call (Service Layer):** The function calls `chat.sendMessage()` with the user's message.
5.  **External Communication:** The `@google/genai` SDK sends an HTTPS request to the Google Gemini API backend.
6.  **API Response (Service Layer):** The SDK receives the response, which is awaited in `handleChatSubmit`.
7.  **UI Update (Logic Layer):** The logic layer removes the loading indicator and renders the AI's response text into a new message bubble in the chat window.
