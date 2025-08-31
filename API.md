# Simulated Tool Contracts (Frontend)

The application simulates a "tool-based" architecture directly within the frontend code. The AI assistant doesn't decide which tool to call; instead, the application logic checks for keywords in the user's message and runs the corresponding function.

These functions are hardcoded in `index.tsx` and provide the data or UI for the chatbot to use.

---

### 1. Project Metadata

Fetches metadata about all portfolio projects. This function is the source of truth for project data used in the UI and by the chatbot.

-   **Trigger:** Called on application startup to render the project cards and is used by the semantic search feature.
-   **Input:** `{}`
-   **Output:** `{ projects: { name: string, description: string, url: string, tags: string[] }[] }`

---

### 2. Contact Email

Simulates sending a contact email and displays a contact form UI.

-   **Trigger:** When the user's message contains keywords like "contact" or "send a message".
-   **Function:** Renders an HTML form in the chat window. When submitted, it calls a function that simulates an API call with a random success/failure outcome.
-   **Input (from form):** `{ name: string, email: string, message: string }`
-   **Output:** `{ status: "sent" | "failed", info?: string }`
