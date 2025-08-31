# Security Considerations

This document outlines key security practices and considerations for the AI-Powered Portfolio application.

## 1. API Key Management

This is the most critical security concern for this application.

### The Problem: Client-Side API Key Exposure

The Google Gemini API key is a sensitive credential. If it is exposed in client-side code (i.e., the JavaScript running in the user's browser), it can be stolen and used by malicious actors, leading to unexpected charges on your account.

### The Solution: Environment Variables & Backend Proxies

-   **Rule #1: NEVER hardcode API keys or other secrets directly in the source code.**
-   **Current Implementation:** The code uses `process.env.API_KEY`. This is a placeholder that relies on the deployment environment to inject the key. However, for a purely static site, many hosting providers' "environment variables" are build-time variables, meaning they get embedded in the static files, which is **not secure**.
-   **Best Practice (Recommended Architecture):** To properly secure the API key, a backend proxy should be used.
    1.  Create a serverless function (e.g., on Vercel, Netlify, or Google Cloud).
    2.  Store the Gemini API key as a secure environment variable for that serverless function.
    3.  The frontend application makes requests to your serverless function's endpoint.
    4.  The serverless function receives the request, attaches the secure API key, and forwards the request to the Google Gemini API.
    5.  The function then returns the API's response to the frontend.

    This ensures the API key **never** leaves your secure backend environment.

## 2. Input Sanitization and Output Encoding

### User Input

-   **Risk:** Users could potentially input malicious scripts or content.
-   **Current Mitigation:** The application currently sends user input directly to the Gemini API. While Gemini has its own safety filters, it's good practice to treat all user input as untrusted. The current application's risk is low because it only displays the user's input back to them inside a `div`, not evaluating it as HTML.
-   **Recommendation:** If the application were to use user input in other ways (e.g., storing it in a database), proper sanitization would be required to prevent Cross-Site Scripting (XSS) attacks.

### Gemini API Output

-   **Risk:** Although unlikely, it's theoretically possible for the model's output to contain content that could be interpreted as HTML or script if not handled carefully.
-   **Current Mitigation:** The application uses `bubble.innerHTML = text`. While this allows for simple markdown-to-HTML conversion (e.g., for bolding), it could be a vector for XSS if the model's output were compromised.
-   **Recommendation:** For enhanced security, one could either:
    1.  Set `bubble.textContent = text` and forgo HTML rendering.
    2.  Use a trusted, lightweight markdown parser that sanitizes its output to render the response.

## 3. Rate Limiting and Abuse Prevention

-   **Risk:** A malicious actor could spam the chatbot endpoint, driving up API costs.
-   **Mitigation (via Backend Proxy):** Implementing a backend proxy allows for rate limiting. You can limit the number of requests a single IP address or user can make within a certain time frame, preventing abuse. This is not possible in a purely client-side architecture.
