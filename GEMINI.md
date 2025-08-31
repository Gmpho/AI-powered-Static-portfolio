# Gemini API Integration Deep Dive

This document provides a detailed look into how the Google Gemini API is integrated into this portfolio application.

## 1. SDK and Initialization

-   **Library:** `@google/genai` (imported via ESM from `esm.run`).
-   **Model:** `gemini-2.5-flash`. This model is chosen for its excellent balance of performance, speed, and cost-effectiveness, making it ideal for a real-time chat application.
-   **Initialization:** The `GoogleGenAI` client is instantiated in the `initializeAI` function. Crucially, the API key is retrieved from `process.env.API_KEY`. This is a placeholder that must be replaced by a secure mechanism in the deployment environment. **It is critical to never hardcode the API key in the source code.**

```typescript
// From index.tsx
ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
```

## 2. The Chat Session

Instead of making single, stateless calls, the application uses the `ai.chats.create()` method to establish a persistent chat session.

### Advantages of a Chat Session

-   **Conversation History:** The SDK automatically manages the conversation history. When you send a follow-up message like "tell me more," the model has the context of the previous turns and can provide a relevant answer.
-   **Simpler API:** You only need to send the new message, not the entire conversation history with each request.

## 3. Prompt Engineering: The System Instruction

The "brain" of the G.E.M. AI assistant is its **system instruction**. This is a detailed prompt provided to the model when the chat session is created. It defines the AI's persona, rules, and capabilities.

### Key Components of the System Instruction (`projectsContext`)

1.  **Persona Definition:** "You are 'G.E.M.', a witty and insightful AI guide...". This sets the tone and personality.
2.  **Core Directives:** A list of rules the AI must follow, such as "Be Enthusiastic & Descriptive," "Ask Clarifying Questions," and "Be Proactive & Suggest Questions." This guides the model's behavior to create a more engaging conversation.
3.  **Tone of Voice Examples:** Concrete examples are provided to show the AI *how* to respond in certain situations (e.g., when asked about the tech stack). This is a powerful technique known as few-shot prompting.
4.  **Data Grounding:** The project information is injected directly into the prompt. This ensures the AI's knowledge is limited to the provided data and prevents it from hallucinating or providing incorrect information about the projects.

```typescript
// From index.tsx
chat = ai.chats.create({
  model: "gemini-2.5-flash",
  config: {
    systemInstruction: projectsContext,
  },
});
```

## 4. Handling Responses and Errors

### Making a Call

The `chat.sendMessage({ message: userMessage })` method is used to send the user's input to the API. This is an asynchronous operation that returns a `Promise`.

### Processing the Response

-   The response object (`GenerateContentResponse`) contains the model's output.
-   The most direct way to get the text is via the `response.text` property.
-   The application then takes this text and injects it into the chat UI.

### Error Handling

API calls can fail for various reasons (network issues, invalid API key, etc.). The `sendMessage` call is wrapped in a `try...catch` block.

-   If an error occurs, it's logged to the console for debugging.
-   A user-friendly error message is displayed in the chat window ("Oops! I seem to be having a little trouble connecting..."). This ensures a good user experience even when things go wrong.
