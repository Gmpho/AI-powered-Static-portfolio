# Known Issues and Resolutions

## Issue: Chatbot 503 Service Unavailable / 404 Not Found for Gemini Model

**Date Identified:** October 1, 2025

**Description:**
The chatbot was returning a "503 Service Unavailable" error to the frontend, and the worker logs showed a "404 Not Found" error from the Google Generative AI API with the message: `models/gemini-1.5-flash is not found for API version v1, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.` This occurred in both local development and production environments.

**Root Cause:**
The `worker/src/index.ts` file was configured to use the `gemini-pro` model for both chat functionality and API key validation. However, the project's `GEMINI.md` documentation indicated that the intended model was `gemini-2.5-flash`. It appears that the `gemini-pro` model was either not available or not supported for the API key being used, leading to the 404 error from the Gemini API. The `option.md` file contained logs showing the `gemini-1.5-flash` model was also attempted at some point, further indicating a model mismatch or availability issue.

**Resolution:**
The model name in `worker/src/index.ts` was updated from `gemini-pro` to `gemini-2.5-flash` in two locations:
1.  Within the main `fetch` handler for the chat functionality.
2.  Within the `validateGeminiKey` function.

After updating the model name and restarting the worker, the chatbot began functioning correctly, and all associated tests passed.

**Affected Files:**
*   `worker/src/index.ts`
*   `option.md` (contained diagnostic logs)
*   `GEMINI.md` (contained conflicting model information)

**Steps to Reproduce (prior to fix):**
1.  Ensure `worker/src/index.ts` is configured to use an unsupported or unavailable Gemini model (e.g., `gemini-pro` with a key that doesn't support it, or `gemini-1.5-flash` if not available).
2.  Start the frontend and worker development servers.
3.  Attempt to interact with the chatbot.

**Verification Steps (after fix):**
1.  Restart the worker development server.
2.  Interact with the chatbot to confirm it responds correctly.
3.  Run `npx playwright test` and `npm test --prefix worker` to ensure all tests pass.
4.  Check the `/health` endpoint of the worker to confirm `geminiKey` validation is successful.