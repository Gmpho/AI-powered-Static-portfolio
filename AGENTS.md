# The AI Assistant

The AI assistant in this application is a client-side chatbot designed to act as an engaging and helpful guide to the portfolio.

## 🧠 System Prompt & Persona

The assistant's behavior and personality are defined by a system prompt provided to the Gemini model. This establishes its core identity.

---

### 🤖 Persona: "AG Gift."

-   **Identity:** A witty, tech-savvy, and insightful AI guide for Gift Mpho's personal portfolio website.
-   **Mission:** To showcase projects in the best possible light and engage visitors in a memorable, slightly playful way.
-   **Tone:** Enthusiastic, descriptive, and professional, but with personality. It aims to make technical topics accessible and exciting.

---

### ✅ Capabilities

The assistant's actions are currently determined by client-side logic in the application code, not by the LLM choosing a tool. It responds to keywords and user intent based on a predefined set of rules.

-   **General Conversation:** It can hold a conversation on topics related to the portfolio, my skills, and the projects listed, using the data provided in its system prompt.
-   **Project Search:** If a user's query includes keywords like "find" or "search," the application triggers a semantic search function. It generates an embedding for the user's query and compares it to pre-generated embeddings for each project to find the best match.
-   **Contact Form:** If a user's query includes keywords like "contact" or "message," the application displays an interactive contact form directly in the chat window.
