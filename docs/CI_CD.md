# CI/CD Guide — GitHub Actions for Frontend + Cloudflare Worker

This project uses GitHub Actions to build and publish the static frontend (GitHub Pages) and to deploy the Cloudflare Worker backend. The guide below explains the pipeline, key steps, and recommended secrets.

## Overview

- Trigger: `push` to `main` (you can add `workflow_dispatch` for manual runs).
- Targets: GitHub Pages (frontend) and Cloudflare Workers (backend).
- Goals: deterministic builds, artifact upload, and safe secret handling for the worker deployment.

## Recommended Secrets (GitHub repository secrets)

- `GITHUB_TOKEN` (provided by Actions) — used for artifact operations
- `CF_API_TOKEN` — Cloudflare API token with `Workers:Edit` and `Account:Read` (store safely)
- `CF_ACCOUNT_ID` — your Cloudflare account id
- `RATE_LIMIT_KV_ID` — KV namespace ID used by the worker for rate limiting (optional: use wrangler envs instead)
- `GEMINI_API_KEY` — (if you deploy worker in CI, otherwise keep in environment)
- `ALLOWED_ORIGINS` — comma-separated list of allowed origins for CORS (optional)

## High-level Workflow

1. Checkout the repository.
2. Set up Node (LTS) and cache dependencies.
3. Install and build the frontend (`frontend/`).
4. Upload the `frontend/dist` artifact (or publish directly to Pages).
5. Install worker dependencies (`worker/`).
6. Deploy Cloudflare Worker, ensuring rate limiting and guardrails are active.

## Minimal GitHub Actions snippet

Below is a compact example you can adapt. Place it as `.github/workflows/deploy.yml`.

```yaml
name: Deploy

on:
    push:
        branches: [ main ]

jobs:
    build-and-deploy:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout
                uses: actions/checkout@v4

            - name: Setup Node
                uses: actions/setup-node@v4
                with:
                    node-version: 18

            - name: Install frontend deps
                working-directory: ./frontend
                run: npm ci

            - name: Build frontend
                working-directory: ./frontend
                run: npm run build

            - name: Publish to GitHub Pages
                uses: peaceiris/actions-gh-pages@v3
                with:
                    deploy_dir: ./frontend/dist

            - name: Install worker deps
                working-directory: ./worker
                run: npm ci

            - name: Deploy Cloudflare Worker
                env:
                    CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
                    CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
                run: |
                    npm --prefix worker run build || true
                    npx wrangler publish worker/src/index.ts --account-id ${{ secrets.CF_ACCOUNT_ID }}
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
