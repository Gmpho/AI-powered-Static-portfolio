# CI/CD Pipeline

This document describes a recommended Continuous Integration and Continuous Deployment (CI/CD) pipeline for the AI-Powered Portfolio project using GitHub Actions.

## Overview

The goal of our CI/CD pipeline is to automate the process of testing and deploying the application. Since this is a static frontend project, the pipeline is straightforward:

1.  **Trigger:** The pipeline runs on every push to the `main` branch.
2.  **Setup:** The environment is set up with the correct Node.js version.
3.  **Linting (Future):** Run a linter (like ESLint) to check for code quality and style issues.
4.  **Testing (Future):** Run unit and integration tests to ensure the application works as expected.
5.  **Deployment:** Deploy the static files (`index.html`, `index.css`, `index.tsx`, etc.) to a hosting provider.

## Recommended Hosting Provider

Services like **Vercel**, **Netlify**, or **GitHub Pages** are ideal for hosting this project. They offer seamless integration with GitHub repositories and automate the deployment process.

### Environment Variables

A crucial step in configuring the hosting provider is to set the `API_KEY` environment variable. This ensures your Google Gemini API key is securely available to the application without being exposed in the source code.

-   **Variable Name:** `API_KEY`
-   **Value:** Your Google Gemini API Key

## Example GitHub Actions Workflow

Below is a sample workflow file that can be created at `.github/workflows/deploy.yml`. This example assumes deployment to GitHub Pages but can be easily adapted for other providers.

```yaml
# .github/workflows/deploy.yml

name: Deploy Portfolio to GitHub Pages

on:
  # Runs on pushes targeting the main branch
  push:
    branches: ["main"]

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  # Build and deploy job
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # Note: This project does not have a build step, as it uses browser-native ES modules.
      # If a build step (e.g., with Vite or Webpack) were added, it would go here.
      # Example:
      # - name: Use Node.js
      #   uses: actions/setup-node@v4
      #   with:
      #     node-version: '20'
      # - name: Install Dependencies
      #   run: npm install
      # - name: Build Project
      #   run: npm run build
      #   env:
      #     API_KEY: ${{ secrets.API_KEY }} # This is NOT secure for client-side code

      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          # Upload the entire repository
          path: '.'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

```

### Security Note on `API_KEY` in CI/CD

The `API_KEY` is a **secret** and must be handled carefully.

-   **Correct Approach (Runtime):** The current application is designed to use the API key at runtime (in the browser). The deployment environment (e.g., Vercel) must provide this key to the application. **This project's code expects `process.env.API_KEY` to be available in the browser context.** Most modern hosting platforms for frontend apps do not expose build-time secrets to the client-side code directly for security reasons. A common pattern is to use a serverless function as a proxy to the Gemini API, where the API key can be stored securely.
-   **For this project's current architecture:** The hosting provider must have a mechanism to substitute environment variables at runtime or the architecture must be changed to use a backend proxy. For demonstration purposes, some environments might allow this, but it's not a best practice.
