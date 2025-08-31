# API Reference

This document provides an overview of the primary APIs used in the AI-Powered Portfolio application.

## 1. Google Gemini API

The core of the chatbot functionality is powered by the Google Gemini API, accessed via the `@google/genai` JavaScript SDK.

### Initialization

The API client is initialized with an API key sourced from environment variables.

-   **SDK:** `@google/genai`
-   **Class:** `GoogleGenAI`
-   **Model:** `gemini-2.5-flash` (A powerful, fast, and multimodal model)

### Key Methods Used

-   **`ai.chats.create(CreateChatParams)`**:
    -   **Purpose:** Initializes a new chat session.
    -   **Parameters:**
        -   `model`: The specific model to use (e.g., `'gemini-2.5-flash'`).
        -   `config.systemInstruction`: A string that provides context, instructions, and persona for the AI model. This is critical for controlling the agent's behavior.
    -   **Returns:** A `Chat` object used for subsequent interactions.

-   **`chat.sendMessage(SendMessageParams)`**:
    -   **Purpose:** Sends a user's message to the chat session and retrieves the AI's response.
    -   **Parameters:**
        -   `message`: The user's text prompt.
    -   **Returns:** A `Promise<GenerateContentResponse>` containing the model's text response and other metadata. The text is accessed via the `.text` property.

## 2. Web Speech API

The application uses the Web Speech API for voice input, providing an alternative to typing. This is a browser-native API and its availability may vary.

### Interfaces Used

-   **`SpeechRecognition` (`webkitSpeechRecognition` for Chrome):** The main interface for the speech recognition service.

### Key Properties & Event Handlers

-   **`recognition.continuous`**: Set to `false` to stop listening after the user stops speaking.
-   **`recognition.interimResults`**: Set to `true` to get real-time, intermediate results as the user speaks.
-   **`onstart`**: Event handler fired when the recognition service starts. Used to update UI to a "listening" state.
-   **`onend`**: Event handler fired when the service stops. Used to revert UI to its default state.
-   **`onresult`**: Event handler fired when a speech result is available. The transcript is extracted from the event object.
-   **`onerror`**: Event handler for recognition errors (e.g., `not-allowed` if microphone permission is denied).

### Implementation Notes

-   The application performs a feature check to see if `SpeechRecognition` is supported by the user's browser. If not, the microphone button is hidden.
-   Robust error handling is in place to inform the user if microphone permissions are denied or if network errors occur.
