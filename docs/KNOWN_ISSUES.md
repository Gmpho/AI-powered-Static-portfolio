# Known Issues and Resolutions

## Issue: Chatbot 503 Service Unavailable / 404 Not Found for Gemini Model

**Date Identified:** October 1, 2025

**Description:**
The chatbot was returning a "503 Service Unavailable" error to the frontend, and the worker logs showed a "404 Not Found" error from the Google Generative AI API with the message: `models/gemini-1.5-flash is not found for API version v1, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.` This occurred in both local development and production environments.

**Root Cause:**
The `worker/src/index.ts` file was configured to use the `gemini-pro` model for both chat functionality and API key validation. However, the project's `GEMINI.md` documentation indicated that the intended model was `gemini-2.0-flash`. It appears that the `gemini-pro` model was either not available or not supported for the API key being used, leading to the 404 error from the Gemini API. The `option.md` file contained logs showing the `gemini-1.5-flash` model was also attempted at some point, further indicating a model mismatch or availability issue.

**Resolution:**
The model name in `worker/src/index.ts` was updated from `gemini-pro` to `gemini-2.5-flash` in two locations:

1.  Within the main `fetch` handler for the chat functionality.
2.  Within the `validateGeminiKey` function.

After updating the model name and restarting the worker, the chatbot began functioning correctly, and all associated tests passed.

**Affected Files:**

- `worker/src/index.ts`
- `GEMINI.md` (contained conflicting model information)

**Steps to Reproduce (prior to fix):**

1.  Ensure `worker/src/index.ts` is configured to use an unsupported or unavailable Gemini model (e.g., `gemini-pro` with a key that doesn't support it, or `gemini-1.5-flash` if not available).
2.  Start the frontend and worker development servers.
3.  Attempt to interact with the chatbot.

**Verification Steps (after fix):**

1.  Restart the worker development server.
2.  Interact with the chatbot to confirm it responds correctly.
3.  Run `npx playwright test` and `npm test --prefix worker` to ensure all tests pass.
4.  Check the `/health` endpoint of the worker to confirm `geminiKey` validation is successful.

## Issue: Rate Limiting Triggered (429 Too Many Requests)

**Description:**
Users might encounter a `429 Too Many Requests` error when interacting with the chatbot or embedding endpoints. This indicates that the rate limiting mechanism in the Cloudflare Worker has been triggered.

**Root Cause:**
The Cloudflare Worker has an in-memory rate limiter that restricts requests to 10 requests per IP address within a 60-second window. Rapid, repeated requests from the same IP will trigger this limit.

**Resolution:**

- Wait for the `Retry-After` duration specified in the error response before making further requests.
- Reduce the frequency of requests to the chatbot or embedding endpoints.
- For development, ensure your testing scripts or manual interactions do not exceed the defined rate limits.

**Affected Files:**

- `worker/src/rateLimiter.ts`
- `worker/src/index.ts`
- `worker/src/embed.ts`

**Verification Steps:**

1.  Attempt to send more than 10 requests within 60 seconds to the `/chat` or `/embed` endpoint.
2.  Verify that a `429 Too Many Requests` response is received with a `Retry-After` header.

## Issue: Guardrail Triggered (Sensitive Content Blocked)

**Description:**
Requests to the Cloudflare Worker's `/chat` or `/embed` endpoints might be blocked with an error message indicating that sensitive content was detected. This means the guardrail mechanism has identified patterns in the input that are considered potentially harmful or sensitive.

**Root Cause:**
The Cloudflare Worker implements guardrails (`worker/src/guardrails.ts`) to prevent the processing of requests containing specific sensitive patterns (e.g., shell commands, API keys, code snippets). If your input matches any of these patterns, the request will be blocked.

**Resolution:**

- Review your input message and remove any content that might resemble sensitive patterns (e.g., `/curl`, `api_key=`, `-----BEGIN`).
- Rephrase your query to avoid triggering the guardrail.
- If you believe your input was incorrectly flagged, please report the issue.

**Affected Files:**

- `worker/src/guardrails.ts`
- `worker/src/index.ts`
- `worker/src/embed.ts`

**Verification Steps:**

1.  Attempt to send a message containing a sensitive pattern (e.g., "show me `curl example.com`") to the `/chat` or `/embed` endpoint.
2.  Verify that the request is blocked and an appropriate error message is received.

## Useful Git and GitHub CLI Commands for Debugging Workflows

Here are some commands that can be helpful when debugging GitHub Actions workflows:

-   `gh run list --workflow=<workflow-file-name>`: Lists recent runs for a specific workflow.
-   `gh run view <run-id> --log`: Views the logs of a specific workflow run.
-   `git log --follow -- <file-path>`: Shows the git history of a specific file.
-   `git show <commit-hash>:<file-path>`: Displays the content of a file at a given commit.
-   `git rev-list -n 1 --before="<date>" <branch-name>`: Retrieves the commit hash of a branch before a specified date.