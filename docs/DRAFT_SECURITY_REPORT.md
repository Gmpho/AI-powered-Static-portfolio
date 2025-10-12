## File: .github/workflows/static.yml
### L43: [CRITICAL] Hardcoded Secrets
**Vulnerability:** Hardcoded Secrets
**Severity:** Critical
**Location:** .github/workflows/static.yml
**Line Content:** `GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}`
**Description:** The `GEMINI_API_KEY` is passed as a plain environment variable to the `node scripts/generateEmbeddings.ts` script. Environment variables in GitHub Actions can be exposed in logs, especially if the script fails or is intentionally modified to print them. This provides a direct path for secret exfiltration.
**Recommendation:** Never pass secrets as direct environment variables to scripts in CI. Use a more secure method, such as fetching the secret from a secure vault within the script, or passing it via a file that has restricted permissions and is deleted after use. For this specific case, since the embeddings generation is a build-time step, consider if this process can be done in a more secure, isolated environment rather than directly in the deployment workflow.