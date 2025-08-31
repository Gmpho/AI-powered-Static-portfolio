# Agent Architecture and LangChain

The "Portfolio Agent" in this project is an implementation of the "agent" concept, where a Large Language Model (LLM) is used as a reasoning engine to decide which actions to take. This approach is heavily inspired by and compatible with concepts from frameworks like **LangChain**.

## What is an Agent?

An agent is a system that uses an LLM to:
1.  **Reason:** Analyze a user's request to understand the underlying intent.
2.  **Plan:** Break down the request into a series of steps.
3.  **Act:** Choose and execute a **tool** to perform a specific action for each step.
4.  **Observe:** Evaluate the result of the tool's execution.
5.  **Repeat:** Continue this process until the user's original request is fulfilled.

## How This Project Implements the Agent Concept

This project uses the **Model Context Protocol (MCP) SDK** to build its agent, which functions similarly to a LangChain agent.

-   **LLM as Reasoning Engine:** The project uses the Gemini API as the "brain" of the agent to interpret user queries.
-   **Tools:** The functions defined in the `/mcp/tools` directory are the equivalent of LangChain's `Tools`. They are discrete, single-purpose functions that the agent can call upon (e.g., `notionQuery`, `pineconeSearch`).
-   **Orchestration:** The **MCP Server** acts as the "Agent Executor." It is responsible for receiving the LLM's decision and actually running the corresponding tool code with the correct parameters.
-   **Schema & Validation:** The use of Zod for defining strict input/output schemas for each tool is a best practice that ensures reliability, similar to how LangChain tools can be defined with structured inputs.

By building on these core principles, the Portfolio Agent is a powerful and extensible system capable of complex, multi-step reasoning to interact with its environment and external services.
