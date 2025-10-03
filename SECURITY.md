# Security Overview and Best Practices

Security is paramount for any application, especially one leveraging powerful APIs like Gemini. This document outlines the current security architecture and best practices implemented in this project.

## 1. Secure API Access Model: Cloudflare Worker Proxy

**Previous Issue:** The initial implementation exposed the Google Gemini API key on the client-side, posing a significant security risk.

**Current Solution:** This critical vulnerability has been resolved. All communication with the Gemini API is now securely routed through a **Cloudflare Worker**, acting as a robust backend proxy. This enforces a strict `Frontend Browser -> Cloudflare Worker -> Google Gemini API` flow.

**Benefits:**
*   **API Key Protection:** The `GEMINI_API_KEY` is securely stored as a Cloudflare Worker secret, never exposed to the client-side or committed to the repository.
*   **Centralized Control:** The Worker provides a single, secure point for managing API calls, enforcing policies, and implementing additional security measures.

## 2. Comprehensive Input and Output Guardrails

To prevent malicious input and ensure safe outputs, the Cloudflare Worker implements a multi-layered guardrail system:

*   **Input Validation (Zod):** All incoming requests to the Worker's API endpoints (e.g., `/chat`, `/embed`) undergo strict schema validation using Zod. This prevents oversized or malformed payloads from reaching the core logic.
*   **Injection Detection (Tripwires):** The Worker employs regular expression-based tripwires (`worker/src/guardrails.ts`) to proactively block requests containing sensitive patterns indicative of injection attempts (e.g., `/curl|wget|base64|sk-|api_key=|-----BEGIN/i`). Requests matching these patterns are politely refused.
*   **Output Sanitization:** Before any AI-generated content is sent back to the frontend, it is thoroughly sanitized server-side. This process (`worker/src/guardrails.ts`) strips potentially harmful elements like `<script>` tags, `<iframe>` tags, `data:` URIs, and long base64 strings, and redacts token-like patterns (e.g., `sk-`, `-----BEGIN`), preventing XSS and secret leakage.

## 3. Rate Limiting to Prevent Abuse

To protect against API abuse and denial-of-service attacks, the Cloudflare Worker implements rate limiting:

*   **In-Memory Rate Limiter:** A basic in-memory mechanism tracks request timestamps per client IP address, limiting requests to 10 per IP within a 60-second sliding window. Exceeding this limit results in a `429 Too Many Requests` response with a `Retry-After` header.
*   **Future Enhancement (Distributed Rate Limiting):** For production environments, a more robust, distributed rate limiting solution leveraging Cloudflare KV is planned to ensure consistent limits across all worker instances.

## 4. Secure Secret Management

All sensitive configuration and API keys are managed as Cloudflare Worker secrets:

*   `GEMINI_API_KEY`: Google Gemini API key.
*   `ALLOWED_ORIGINS`: Whitelisted domains for CORS.
*   `GEMINI_SYSTEM_PROMPT`: The AI assistant's system persona prompt.

These secrets are never committed to the repository or exposed client-side. The `GEMINI_SYSTEM_PROMPT.md` file serves as a local reference for the prompt's content but is explicitly `.gitignore`d to prevent accidental commits.

## 5. CORS Enforcement

The Cloudflare Worker strictly enforces Cross-Origin Resource Sharing (CORS) policies. The `ALLOWED_ORIGINS` secret ensures that API endpoints are only accessible from explicitly whitelisted domains, preventing unauthorized access from other origins.

## 6. Audit Logging

For observability and security auditing, the Worker implements audit logging:

*   **Hashed Query IDs:** Instead of logging raw user prompts, SHA-256 hashes of prompts are stored, along with metadata (timestamp, IP, user-agent, status, error, estimated token count). This provides auditability without exposing sensitive user data.
*   **No Raw Prompts:** Raw prompts or responses containing PII are never logged.

## 7. Comprehensive Testing for Security

Security measures are validated through a comprehensive testing strategy:

*   **Worker Unit Tests (Vitest):** Dedicated unit tests (`worker/test/guardrails.spec.ts`) verify the correct functioning of Zod validation, injection detection, and output sanitization.
*   **End-to-End (E2E) Security Tests (Playwright):** Automated E2E tests (`.github/workflows/e2e-security.yml`) run in CI to simulate real-world attack scenarios, including prompt injection, XSS, base64 uploads, and rate limit evasion, ensuring the guardrails and rate limiting mechanisms are effective.

## 8. Continuous Integration and Deployment (CI/CD)

The CI/CD pipeline ensures that all security measures are consistently applied and tested:

*   Automated builds, tests, and deployments to GitHub Pages (frontend) and Cloudflare Workers (backend).
*   Security tests are integrated into the workflow to catch regressions early.

This robust security framework ensures the AI-powered portfolio remains protected against common web vulnerabilities and API misuse.