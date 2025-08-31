# Testing Strategy

This document outlines a testing strategy for ensuring the quality, reliability, and correctness of the AI-Powered Portfolio application. While the current project does not have an automated test suite, this serves as a guide for future implementation.

## 1. Testing Pyramid

We will adopt the standard testing pyramid model, which emphasizes having a large base of fast, simple unit tests, followed by fewer integration tests, and a very small number of slow, comprehensive end-to-end tests.

```
      / \
     / E2E \
    /-------\
   / Integration \
  /---------------\
 /   Unit Tests    \
/-------------------\
```

## 2. Unit Tests

-   **Goal:** To test individual functions and components in isolation.
-   **Tools:** [Jest](https://jestjs.io/) (test runner), [Testing Library](https://testing-library.com/) (for utility functions interacting with the DOM).
-   **What to Test:**
    -   **Helper Functions:**
        -   `addMessage()`: Does it correctly create a DOM element with the right classes and content for 'user', 'bot', and 'loading' states?
        -   `setTheme()`: Does it correctly set the `data-theme` attribute on the `documentElement` and update `localStorage`?
    -   **UI Logic:**
        -   Test the logic that enables/disables the send button based on input.

### Example Unit Test (using Jest)

```javascript
// A hypothetical test for the addMessage function
describe('addMessage', () => {
  it('should create a user message element', () => {
    document.body.innerHTML = '<div id="chatbot-messages"></div>';
    const chatMessages = document.getElementById('chatbot-messages');
    
    addMessage('Hello', 'user');

    const messageEl = chatMessages.querySelector('.message.user');
    expect(messageEl).not.toBeNull();
    expect(messageEl.textContent).toBe('Hello');
  });
});
```

## 3. Integration Tests

-   **Goal:** To test how multiple components work together.
-   **Tools:** Jest, Testing Library.
-   **What to Test:**
    -   **Chat Form Interaction:**
        -   Verify that typing in the input enables the send button.
        -   Verify that submitting the form calls the `handleChatSubmit` function and adds the user's message to the message list.
    -   **AI Chat Flow (with Mocks):**
        -   Test the complete flow of sending a message and receiving a response.
        -   This requires **mocking the Gemini API**. We do not want to make real API calls in our tests. We would mock the `chat.sendMessage` method to return a predefined response immediately.
        -   Verify that a loading indicator appears and is then replaced by the mocked bot response.

## 4. End-to-End (E2E) Tests

-   **Goal:** To test the entire application flow from a user's perspective, running in a real browser.
-   **Tools:** [Cypress](https://www.cypress.io/) or [Playwright](https://playwright.dev/).
-   **What to Test (Key User Journeys):**
    1.  **Full Chat Conversation:**
        -   Open the page.
        -   Click the FAB to open the chat window.
        -   Send a message.
        -   Assert that the user's message appears.
        -   Assert that a bot response appears (this would likely test against a mocked backend to ensure consistent results and avoid costs).
        -   Close the chat window.
    2.  **Theme Toggling:**
        -   Click the theme toggle button.
        -   Assert that the `data-theme` attribute on the `<html>` element changes.
        -   Assert that element colors change as expected.

## 5. Manual & Accessibility Testing

-   **Goal:** To catch issues not easily automated and ensure the application is usable by everyone.
-   **Tools:** Browser DevTools, screen readers (VoiceOver, NVDA), Axe DevTools.
-   **Checklist:**
    -   Verify cross-browser compatibility (Chrome, Firefox, Safari).
    -   Test on different screen sizes (desktop, tablet, mobile).
    -   Ensure all interactive elements are keyboard-navigable.
    -   Check for sufficient color contrast.
    -   Verify all images and icons have appropriate `alt` text or `aria-label`s.
