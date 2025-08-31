# CI/CD Pipeline: The Deploy Loop

The project uses a robust, automated Continuous Integration and Continuous Deployment (CI/CD) pipeline managed via GitHub Actions. The pipeline is designed to ensure code quality, contract validity, and successful deployments.

## 📦 DOCKER + SMITHERY

The foundation of the CI/CD process is containerization and validation.

-   **Docker:** The entire application (including the Node.js backend for the MCP server) is containerized using a `node:20-alpine` base image for a small, secure footprint.
-   **Smithery:** The Smithery.ai tool is used as a critical validation step. It is configured via `smithery.config.json` to:
    1.  Verify that all MCP tool contracts (defined in `/mcp/tools/*.ts`) compile correctly with their Zod schemas.
    2.  Execute the full Playwright E2E test suite from within the Docker container to ensure the application works in a production-like environment.
    3.  Confirm that the Docker image builds cleanly without errors.

## 🔁 DEPLOY LOOP

The deployment process follows a well-defined loop, from local development to production.

1.  **Local Development:**
    -   Developers run the application locally using `npm run dev`.
    -   This environment includes hot-reloading for the MCP tools, allowing for rapid iteration.

2.  **Automated Testing:**
    -   Before committing, developers can run the E2E test suite locally with `npm run test:e2e`.
    -   This same command is run by the CI server.

3.  **CI Pipeline (on push to `main`):**
    -   **Build Docker Image:** The CI job starts by building the production Docker image using `docker build . -t ai-portfolio`.
    -   **Run Smithery Validation:** The pipeline then executes Smithery, which runs the critical validation steps (Zod compilation, Playwright tests) inside the newly built container.
    -   **Conditional Deploy:** The deployment step only proceeds if the Smithery validation is successful (i.e., returns a "green" status).

4.  **GitHub Actions Deployment:**
    -   **UI Deployment:** The static frontend assets are deployed to GitHub Pages.
    -   **Proxy Deployment:** The backend serverless proxy functions (for Gemini, Pinecone, etc.) are deployed to a provider like Netlify, Vercel, or Fly.io.
    -   **Docs Publishing:** Any generated documentation is published to the `/docs` folder on the GitHub Pages site.
