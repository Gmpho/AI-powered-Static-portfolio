# Refactoring Report: Bot Logic E2E Testing with Playwright

## Objective
To refactor the bot's logic tests using Playwright for end-to-end verification, ensuring the chatbot's conversational flow, streaming capabilities, and tool interactions function correctly from the client's perspective. This report will track the progress and findings of this refactoring.

## Plan
1.  **Analyze Existing Playwright Tests:** Review `tests/e2e/portfolio.spec.ts` and `tests/e2e/seed.spec.ts` to identify reusable patterns or areas for new tests.
2.  **Develop Playwright Tests for Bot Logic:**
    *   Verify successful streaming responses from the bot.
    *   Test `projectSearch` tool integration: user query triggers tool, results are displayed.
    *   Test `displayContactForm` tool integration: user request triggers form display.
    *   Validate frontend error handling for bot-related issues.
3.  **Execute Playwright Tests:** Run the newly created/modified tests.
4.  **Document Findings:** Record test results, identified issues, and next steps.

## Progress

### Initial Analysis of Existing Playwright Tests
- `tests/e2e/portfolio.spec.ts`: Contains existing tests for basic bot response, contact form display, and XSS prevention. This file will be extended.
- `tests/e2e/seed.spec.ts`: Currently empty and will not be used for this refactoring.

### Specific Playwright Test Modifications
1.  **Enhance `should send a message and receive a streamed bot response`:**
    *   Modify to explicitly verify streaming behavior (e.g., checking for partial text updates or loading indicators).
    *   Assert that the final bot response accurately reflects the mocked Gemini stream content.
2.  **Add new test: `should handle projectSearch tool call`:**
    *   Simulate a user query that triggers the `projectSearch` tool (e.g., "Tell me about AI projects").
    *   Mock the worker's SSE response to include a `toolCall` event for `projectSearch` followed by streamed text results.
    *   Verify that the UI correctly displays the project information based on the tool's output.
3.  **Refine `should display the contact form when requested`:**
    *   Ensure the test explicitly checks for the `event: toolCallResponse` for `displayContactForm` from the worker's SSE stream.
    *   Verify that the contact form elements are rendered and interactive.
4.  **Implement `parseSSEStream` helper function:** Create a reusable utility within `portfolio.spec.ts` to consume and parse SSE streams, simplifying test assertions.

### New Playwright Test Development
- Implemented `parseSSEStream` helper function.
- Enhanced `should send a message and receive a streamed bot response` to correctly assert concatenated streamed text.
- Added `should handle projectSearch tool call and display results` to verify tool invocation and display of results.
- Refined `should display the contact form when requested via tool call` to correctly mock the tool call response and assert form visibility.
- Modified `should prevent XSS in bot responses (guardrails test)` to correctly mock the worker's guardrail response.

### Test Execution Results
- All 8 Playwright tests in `tests/e2e/portfolio.spec.ts` and `tests/e2e/seed.spec.ts` passed successfully.

### Issues and Next Steps
- The core communication issue has been resolved, and the frontend now correctly handles streamed responses and tool calls.
- The Playwright tests now accurately reflect the application's behavior.
- Next step: Remove debug logs from `worker/test/chat.spec.ts`.
