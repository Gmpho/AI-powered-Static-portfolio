# CI/CD Guide — GitHub Actions for Frontend + Cloudflare Worker

This project uses GitHub Actions to build and publish the static frontend (GitHub Pages) and to deploy the Cloudflare Worker backend. The guide below explains the pipeline, key steps, and recommended secrets.

## Overview

- Trigger: `push` to `main` (you can add `workflow_dispatch` for manual runs).
- Targets: GitHub Pages (frontend) and Cloudflare Workers (backend).
- Goals: deterministic builds, artifact upload, and safe secret handling for the worker deployment.

## Recommended Secrets (GitHub repository secrets)

- `GITHUB_TOKEN` (provided by Actions) — used for artifact operations
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with `Workers:Edit` and `Account:Read` permissions (store safely)
- `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare account ID
- `VITE_WORKER_URL` — The URL of your deployed Cloudflare Worker (used by the frontend build)


## High-level Workflow

This workflow consists of two main jobs:

### 1. `deploy` Job (Frontend Deployment)

1.  Checkout the repository.
2.  Clean the build environment (`node_modules`, `dist`).
3.  Set up Node.js (LTS).
4.  Install root dependencies (`npm install`).
5.  Install frontend dependencies (`npm install` in `frontend/`).
6.  Build the frontend (`npm run build`), injecting `VITE_WORKER_URL` from secrets.
7.  Set up GitHub Pages.
8.  Upload the built frontend artifact (`./dist`).
9.  Deploy the frontend to GitHub Pages.

### 2. `deploy-worker` Job (Worker Deployment)

This job `needs: deploy`, meaning it runs *after* the frontend has been deployed.

1.  Checkout the repository.
2.  Set up Node.js (LTS).
3.  Install worker dependencies (`npm install --prefix worker`).
4.  Deploy the Cloudflare Worker using `cloudflare/wrangler-action`.


## Minimal GitHub Actions snippet

Below is a compact example you can adapt. Place it as `.github/workflows/deploy.yml`.

```yaml
name: Deploy static content to Pages

on:
  push:
    branches: ['main']

  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
      - name: Clean build environment
        run: |
          rm -rf node_modules
          rm -rf dist
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: 'npm'
      - name: Install Root Dependencies
        run: npm install
      - name: Install Frontend Dependencies
        run: npm install
        working-directory: frontend
      - name: Build
        run: npm run build
        working-directory: .
        env:
          VITE_WORKER_URL: ${{ secrets.VITE_WORKER_URL }}
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

  deploy-worker:
    runs-on: ubuntu-latest
    needs: deploy
    steps:
      - name: Checkout
        uses: actions/checkout@v5
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: 'npm'
      - name: Install worker dependencies
        run: npm install --prefix worker
      - name: Deploy worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: 'deploy worker/src/index.ts'
```

Notes:

- Use npm ci for deterministic installs in CI.
- Prefer wrangler publish over wrangler deploy in CI for consistency.
- Do not print secrets to logs. Use environment variables and GitHub secrets.

## Rollback & Safety

- To rollback, re-run a previous workflow or push a release tag pointing to a known-good commit.
- Add workflow_dispatch to allow manual redeploys from the Actions UI.
- **Post-deployment Verification:** Always verify the worker's rate limiting and guardrail functionalities after deployment to ensure security measures are active and functioning as expected.

If you want, I can also add a full, ready-to-use `.github/workflows/deploy.yml` in the repo that matches your existing configuration and secrets. Would you like me to commit that as well?
