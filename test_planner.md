# Comprehensive Test Plan: AI-Powered Static Portfolio

## Objective
To provide a detailed, L7-standard test plan for the AI-Powered Static Portfolio application, covering functional, performance, security, and architectural aspects from frontend to backend. This plan leverages existing documentation and code analysis to ensure thorough test coverage.

## Scope
The entire application, including:
*   Frontend (UI, user interactions, responsiveness, loading performance)
*   Backend Cloudflare Worker (API endpoints, AI integration, tool handling, rate limiting, guardrails)
*   Data layers (project data, chat history persistence)
*   CI/CD workflows (deployment, testing gates)
*   Security posture (XSS, prompt injection, secret management, DDoS considerations)

## Methodology
This test plan is generated through a comprehensive analysis of the application's codebase, architecture, and existing documentation (GEMINI.md, CODE_REVIEW.md, SECURITY_AUDIT_REPORT.md, FEATURE_THINKING_MODE.md, REFACTORING_REPORT.md). It focuses on identifying critical user journeys, potential failure points, and areas requiring robust validation.

## Test Categories

### 1. Functional Testing

#### 1.1 Frontend User Flows
*   **Intent:** Verify all user-facing interactions and navigation work as expected.
*   **Scenarios:**
    *   **Homepage Load & Project Display:**
        *   **Steps:** Navigate to homepage.
        *   **Expected:** All project cards are visible and correctly rendered.
        *   **Success Criteria:** No broken images, correct text, clickable links.
    *   **Navigation:**
        *   **Steps:** Click on "About", "Projects" links.
        *   **Expected:** Smooth scroll to respective sections.
        *   **Success Criteria:** Correct section is in view.
    *   **Responsiveness:**
        *   **Steps:** Resize browser window to various breakpoints (mobile, tablet, desktop).
        *   **Expected:** Layout adapts correctly, elements are accessible.
        *   **Success Criteria:** No overflow, elements are aligned, text is readable.

#### 1.2 Chatbot Interactions
*   **Intent:** Validate the chatbot's conversational abilities, tool handling, and specific feature interactions.
*   **Scenarios:**
    *   **Basic Conversation:**
        *   **Steps:** Open chatbot, send "Hello".
        *   **Expected:** Bot responds with a greeting.
        *   **Success Criteria:** Response is relevant and streamed.
    *   **Project Inquiry (AI-Powered Portfolio):**
        *   **Steps:** Ask "Tell me about the AI-Powered Portfolio project."
        *   **Expected:** Bot provides a summary using the `projectSearch` tool.
        *   **Success Criteria:** Summary is accurate, concise, and includes relevant tags/URL.
    *   **Contact Form Request:**
        *   **Steps:** Ask "I want to get in touch."
        *   **Expected:** Bot triggers `displayContactForm` tool, and the contact form appears.
        *   **Success Criteria:** Form fields are present, submit button is active.
    *   **Contact Form Submission:**
        *   **Steps:** Fill out and submit the contact form.
        *   **Expected:** Bot confirms submission.
        *   **Success Criteria:** Confirmation message is displayed.
    *   **Unknown Query:**
        *   **Steps:** Ask a question unrelated to portfolio projects.
        *   **Expected:** Bot politely states it can only discuss the portfolio projects.
        *   **Success Criteria:** Response adheres to persona and scope.

#### 1.3 Backend API Logic (Worker Endpoints)
*   **Intent:** Verify all worker endpoints function correctly and handle various inputs.
*   **Scenarios:**
    *   `/chat` Endpoint:
        *   **Steps:** Send valid POST request with prompt and history.
        *   **Expected:** Streams valid Gemini response.
        *   **Success Criteria:** Status 200, streamed content is valid.
        *   **Steps:** Send POST request with missing/invalid prompt.
        *   **Expected:** Returns 400 Bad Request.
        *   **Success Criteria:** Error message is appropriate.
    *   `/api/generateEmbedding` Endpoint:
        *   **Steps:** Send valid POST request with text.
        *   **Expected:** Returns a valid embedding.
        *   **Success Criteria:** Status 200, embedding is a number array.
        *   **Steps:** Send POST request with missing/invalid text.
        *   **Expected:** Returns 400 Bad Request.
        *   **Success Criteria:** Error message is appropriate.
    *   `/health` Endpoint:
        *   **Steps:** Send GET request.
        *   **Expected:** Returns health status.
        *   **Success Criteria:** Status 200, `geminiKey` and `kvStatus` are reported.
    *   CORS Handling:
        *   **Steps:** Send request from allowed origin.
        *   **Expected:** `Access-Control-Allow-Origin` header is present.
        *   **Success Criteria:** Request is processed.
        *   **Steps:** Send request from disallowed origin.
        *   **Expected:** Returns 403 Forbidden.
        *   **Success Criteria:** Request is blocked.

### 2. Performance Testing Considerations

#### 2.1 Fast Loading
*   **Intent:** Ensure the application loads quickly for optimal user experience.
*   **Considerations:**
    *   Minify and bundle assets (handled by Vite).
    *   Lazy loading of non-critical resources.
    *   Efficient image optimization.
    *   Worker cold start times (monitor in production).

#### 2.2 Streaming Responses
*   **Intent:** Verify the real-time, word-by-word streaming enhances perceived performance.
*   **Considerations:**
    *   Monitor latency between chunks.
    *   Ensure smooth UI updates without jank.

### 3. Security Testing

#### 3.1 Guardrails and Input Validation
*   **Intent:** Verify the effectiveness of input guardrails and output sanitization against various attacks.
*   **Scenarios:**
    *   **Prompt Injection (Worker):**
        *   **Steps:** Send prompts containing `TRIPWIRE` patterns (e.g., `curl`, `sk-`, `api_key=`).
        *   **Expected:** Worker returns "Sensitive content detected" error.
        *   **Success Criteria:** No sensitive data is processed or leaked.
    *   **XSS Prevention (Frontend):**
        *   **Steps:** Send prompts containing malicious HTML/JavaScript (e.g., `<script>alert('XSS')</script>`).
        *   **Expected:** Frontend renders sanitized output, no script execution.
        *   **Success Criteria:** `DOMPurify` effectively neutralizes payloads.
    *   **Input Length Limits:**
        *   **Steps:** Send prompts exceeding defined max length.
        *   **Expected:** Worker returns 400 Bad Request.
        *   **Success Criteria:** Error message is appropriate.

#### 3.2 Secret Management
*   **Intent:** Ensure API keys and other secrets are never exposed client-side or in logs.
*   **Considerations:**
    *   Verify `GEMINI_API_KEY` is only used server-side (Worker).
    *   Review CI/CD for secure handling of secrets (e.g., GitHub Secrets, Cloudflare Worker Secrets).

#### 3.3 Network Security
*   **Intent:** Validate secure communication and access control.
*   **Considerations:**
    *   **SSL/TLS:** Ensure all communication is over HTTPS.
    *   **CORS Policy:** Verify strict CORS headers are enforced by the Worker.
    *   **Rate Limiting:** Test that the distributed rate limiter effectively blocks excessive requests.
    *   **DDoS Resilience:** (High-level) Review Cloudflare WAF/DDoS protection configurations.

### 4. Code Quality & Implementation Review

#### 4.1 Data Duplication
*   **Intent:** Identify and plan for resolving data duplication between `frontend/projects.ts` and `worker/src/projectData.ts`.
*   **Recommendation:** Propose a single source of truth (e.g., a dedicated worker endpoint for project data).

#### 4.2 JSDoc Coverage
*   **Intent:** Ensure all interfaces, classes, and functions have clear JSDoc comments.
*   **Action:** Implement missing JSDoc comments as identified in the code review.

#### 4.3 Error Handling & Logging
*   **Intent:** Verify robust error handling and appropriate logging across the application.
*   **Considerations:**
    *   Consistent error response formats.
    *   Meaningful error messages without exposing sensitive details.
    *   Centralized error logging for monitoring.

## Next Steps
1.  **Implement Missing JSDoc:** Apply the JSDoc comments identified in the code review.
2.  **Refine Documentation:** Update `docs/DRAFT_SECURITY_REPORT.md`, `docs/FEATURE_THINKING_MODE.md`, and `.github/chatmodes/*.md` as per the code review.
3.  **Execute Tests:** Run Playwright E2E tests to validate all functional and security scenarios.
4.  **Monitor & Iterate:** Continuously monitor application performance and security in staging/production environments.
