# 🛠️ Gemini Function Calling & Worker-Orchestrated Tools

The application now leverages Gemini's function calling capabilities, where the AI assistant decides which tool to call based on user intent. The Cloudflare Worker acts as the orchestrator, receiving the tool call from Gemini, executing the corresponding logic, and returning the result. **All AI interaction and tool execution are securely handled by the Cloudflare Worker.**

These tools are defined in `worker/src/tools/` and their schemas are provided to the Gemini model.

---

## 📦 Project Search Tool

This tool allows the Gemini model to search for portfolio projects based on a natural language query.

- **🎯 Trigger:** The Gemini model determines, based on the user's prompt, that a project search is required (e.g., user asks "Find projects about AI").
- **⚙️ Function:** The worker's `projectSearch` tool performs a combined search:
    - It first attempts a semantic search by generating an embedding for the user's query (caching the embedding in KV for future use) and comparing it to pre-computed project embeddings stored in KV.
    - If semantic search fails (e.g., due to API quota limits) or yields no highly relevant results, it gracefully falls back to a comprehensive keyword search across project titles, summaries, descriptions, and tags.
- **📥 Input:** `{ query: string }` (from Gemini model)
- **📤 Output:** An object containing:
    - `projects`: An array of matching `Project` objects (or a message indicating no projects found).
    - `notice` (optional): A string indicating if semantic search was unavailable (e.g., "Semantic search unavailable (quota exceeded). Showing keyword results only.").
    Gemini then uses this output to formulate a conversational response.

---

## 📧 Display Contact & Feedback Form Tool

This tool instructs the frontend to display a contact or feedback form to the user.

- **🎯 Trigger:** The Gemini model determines, based on the user's prompt, that the user wants to make contact or provide feedback (e.g., user asks "How can I contact you?" or "I want to give feedback").
- **⚙️ Function:** The worker's `displayContactForm` tool signals the frontend to render an HTML contact or feedback form within the chat window.
- **📥 Input:** None (no parameters needed for this tool)
- **📤 Output:** A confirmation message to Gemini, and a signal to the frontend to display the form.
