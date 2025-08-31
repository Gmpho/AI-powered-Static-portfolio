# 🚀 CI/CD Pipeline: A Recommended Approach

While this project does not have a pre-configured CI/CD pipeline, this document outlines a recommended approach for setting up an automated Continuous Integration and Continuous Deployment (CI/CD) workflow using modern best practices.

## 📦 DOCKER: The Foundation

The foundation of a reliable CI/CD process is the project's `Dockerfile`.

*   **Docker:** The application is containerized using a multi-stage `Dockerfile`. The first stage uses a `node:20-alpine` image to build the static assets, and the second stage copies these assets into a lightweight `nginx:stable-alpine` image for serving. This process creates a small, secure, and performant final image, which is ideal for deployment.

## 🔁 Recommended Deploy Loop

A typical deployment process for this application would follow this loop:

### Diagram

```mermaid
graph TD
    A[💻 Local Development] --> B(Git Push to main);
    B --> C{🤖 CI Pipeline (GitHub Actions)};
    C --> D[Build & Test];
    D --> E[Build Docker Image];
    E --> F[Push to Container Registry];
    F --> G{🚀 CD (Continuous Deployment)};
    G --> H[Deploy to Container Host];
```

### 1. 💻 Local Development

*   Developers run the application locally using a dev server like `vite`.
*   Code is committed to a Git repository (e.g., on GitHub).

### 2. 🤖 CI Pipeline (on push to `main` branch)

*   A service like GitHub Actions would trigger a new workflow.
*   **Step 1: Build & Test (Future Enhancement):** The CI job would first install dependencies (`npm install`) and run any tests (e.g., linting, unit tests, or end-to-end tests with a tool like Playwright).
*   **Step 2: Build Docker Image:** The pipeline would build the production Docker image using the `docker build` command. It is crucial to securely provide the `VITE_API_KEY` as a build argument or secret.
    ```bash
    docker build --build-arg VITE_API_KEY="${{ secrets.VITE_API_KEY }}" -t ai-portfolio .
    ```
*   **Step 3: Push to Container Registry:** If the build is successful, the Docker image is tagged and pushed to a container registry like Docker Hub, Google Container Registry (GCR), or GitHub Container Registry (GHCR).

### 3. 🚀 CD (Continuous Deployment)

*   **Deployment:** The final step is deploying the container. This could be configured in several ways:
    *   **Static Site Host:** For a purely client-side application, the build artifacts could be deployed directly to a static host like GitHub Pages, Netlify, or Vercel.
    *   **Container Host:** The Docker image from the registry could be deployed to a container hosting service like Google Cloud Run, AWS App Runner, or Fly.io. This is a robust approach that makes use of the provided `Dockerfile`.