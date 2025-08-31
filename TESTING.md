# Testing Protocol (Playwright)

The project relies on end-to-end (E2E) testing using Playwright to ensure the entire system, from the UI to the tool chain, works correctly.

## Core Testing Workflow

The primary test workflow simulates a complete user interaction, validating each step of the architecture:

1.  **Spin up Dev Server:** The Playwright test runner first starts the local development server on `localhost:3000`.
2.  **User Sends Chat:** The test script simulates a user typing a message into the chat input and submitting it.
3.  **MCP Client Request:** Playwright verifies that the frontend (MCP client) successfully sends the request to the backend.
4.  **MCP Server Invocation:** The test environment (using mocks for external services) confirms that the MCP server receives the request and invokes the correct tool.
5.  **Tool Calls Proxy:** The test asserts that the tool attempts to call the correct secure proxy endpoint.
6.  **Response Displayed:** Playwright checks that the final, mocked response from the tool is correctly displayed in the chat UI on the frontend.

## Key E2E Test Scenarios

The test suite must include, at a minimum, the following E2E tests to validate the core tool functionality:

-   **“List my projects”:**
    -   **Trigger:** User sends the message "List my projects".
    -   **Expected Result:** The `Project Metadata` tool is called, and the test asserts that the response displayed in the UI includes the names and descriptions of the portfolio projects.

-   **“Analyze my resume”:**
    -   **Trigger:** User sends a message like "Analyze my resume" and provides resume text.
    -   **Expected Result:** The `Resume Analyzer` tool is called, and the test asserts that the response displayed in the UI includes distinct sections for "strengths" and "weaknesses".
