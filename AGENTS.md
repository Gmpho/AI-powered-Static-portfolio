# AI Agents in this Project

This document outlines the concept and implementation of AI agents within the AI-Powered Portfolio.

## The G.E.M. Agent

The primary AI agent in this application is **G.E.M.** (short for **G**uide for **E**ngaging **M**oments). G.E.M. is designed to be more than just a simple question-and-answer bot; it's a persona-driven agent with specific directives.

### Core Architecture

G.E.M. is a stateless, prompt-driven agent. Its behavior is defined by a carefully crafted **system instruction** provided to the Google Gemini model. This approach is powerful because it allows for complex behaviors to be defined in natural language without writing extensive conditional logic.

### Key Characteristics

1.  **Persona-Driven:** G.E.M. has a witty, insightful, and enthusiastic personality. This persona is defined in the system prompt and is crucial for creating an engaging user experience.
2.  **Goal-Oriented:** The agent's primary goal is to showcase the portfolio projects effectively. It proactively suggests follow-up questions and guides the conversation towards this objective.
3.  **Knowledge-Bound:** G.E.M.'s knowledge is strictly limited to the project data provided in its context (`projectsContext`). It cannot access external information unless a tool like Google Search grounding is enabled.
4.  **Reactive:** The agent reacts to user inputs. It does not initiate conversations or perform actions without a user prompt.

### Implementation

The agent is implemented via the `chat` instance created from the `@google/genai` SDK.

-   **Initialization:** The agent's persona and knowledge base are loaded during initialization within the `initializeAI` function in `index.tsx`.
-   **Interaction:** User messages are sent to the Gemini API through the `chat.sendMessage()` method. The conversation history is managed by the SDK, allowing the agent to have contextually aware follow-up conversations.

## Future Enhancements: Towards More Advanced Agents

While G.E.M. is effective, it represents a simple form of an AI agent. Future iterations could evolve G.E.M. into a more sophisticated agent by:

-   **Giving it Tools:** Allowing the agent to access external APIs (e.g., GitHub API to fetch real-time project stats, or a calendar API to schedule meetings).
-   **Enabling Proactive Behavior:** Implementing mechanisms for the agent to provide timely, unprompted suggestions based on user behavior on the site.
-   **Stateful Memory:** Integrating a vector database to give the agent long-term memory about user interactions, allowing for more personalized conversations.

For more information on building advanced agents, see `LANGCHAIN_AGENTS.md`.
