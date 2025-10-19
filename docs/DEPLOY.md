# Deployment Guide

This document explains a safe, repeatable deployment for the project:

- Frontend (Vite SPA) → GitHub Pages
- Backend (Cloudflare Worker) → Cloudflare Workers (wrangler)

Follow the sections below in order.

**Prerequisites**

- Node.js (v18+ / recommend v20)
- npm
- npx (comes with npm)
- wrangler (Cloudflare CLI) installed and authenticated
- GitHub repository with Actions enabled

**Secrets and GitHub repository settings**
Add the following repository secrets (Settings → Secrets → Actions):

- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with `Workers:Edit` and `Account:Read` permissions
- `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare Account ID
- `VITE_WORKER_URL` — The URL of your deployed Cloudflare Worker (used by the frontend build)

Do not commit secrets or production keys to the repository.

1. Create Cloudflare KV namespace for Rate Limiting (one-time)
   Run locally (PowerShell / pwsh):

```pwsh
npx wrangler kv:namespace create "RATE_LIMIT_KV"
```

Copy the `id` from the command output and save it to your secure secrets store (or GitHub secret `RATE_LIMIT_KV_ID`). This KV namespace will be used by the Worker for distributed rate limiting.

% DEPLOYMENT GUIDE (synchronized with GEMINI.md)

This deployment guide is kept in sync with `GEMINI.md` (the project source-of-truth for architecture, runtime, and operational guidance).

Overview

- Frontend (Vite SPA) → GitHub Pages
- Backend (Cloudflare Worker) → Cloudflare Workers (wrangler)

- Node.js (v18+; v20 recommended)
- npm / npx
- `wrangler` (Cloudflare CLI) installed and authenticated
- GitHub repository with Actions enabled

- Start the frontend dev server (Vite):

- `CF_API_TOKEN` — Cloudflare API token (least-privilege; Worker publish + KV access)
- `CF_ACCOUNT_ID` — Cloudflare Account ID
- `RATE_LIMIT_KV_ID` — KV Namespace ID for production
- `GEMINI_API_KEY` — Google Gemini API key for the Worker

- Configure the frontend to call the local worker by setting `VITE_WORKER_URL` or similar in `.env` (Vite picks up `.env` variables).

**3) Deploy frontend to GitHub Pages (recommended: Actions)**

- Ensure `vite.config.ts` `base` is set correctly for your Pages setup:
  - For project Pages: `base: '/<repo>/'`
  - For user Pages or custom domain: `base: '/'`

- Build locally:

```pwsh
npm --prefix frontend ci
npm --prefix frontend run build
```

- Quick manual publish (not recommended for CI): push `frontend/dist` to `gh-pages` branch.

- - Recommended: use GitHub Actions to build and publish automatically. Refer to `.github/workflows/static.yml` for the current, working workflow.

**4) Worker `wrangler.toml` template**
Keep this file simple and avoid committing production tokens. Use environment interpolation in CI.

Example `worker/wrangler.toml`:

```toml
name = "my-portfolio-worker"
main = "src/index.ts"
compatibility_date = "2025-10-01"

kv_namespaces = [
  { binding = "RATE_LIMIT_KV", id = "YOUR_RATE_LIMIT_KV_ID" },
  { binding = "PROJECT_EMBEDDINGS_KV", id = "YOUR_PROJECT_EMBEDDINGS_KV_ID" }
]

[build]
command = "npm ci && npm run build"

[env.production]
# production specific overrides (if needed)
```

In CI you can set the env mapping for `CLOUDFLARE_ACCOUNT_ID`, `RATE_LIMIT_KV_ID`, and `PROJECT_EMBEDDINGS_KV_ID` via GitHub Actions secrets.

**5) Managing Worker secrets (GEMINI_API_KEY, ALLOWED_ORIGINS)**
During interactive local development:

```pwsh
cd worker
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ALLOWED_ORIGINS
```

In GitHub Actions you can:

- Use `wrangler secret put` by running a step with `wrangler` and the secrets injected from GitHub Actions secrets.
- Or use the `wrangler-action` `apiToken` to publish and then set secrets via Cloudflare UI.

_Note: Guardrails are implemented directly in the Worker code (`worker/src/guardrails.ts`) and do not require separate secret management._

**6) CORS and Allowed Origins**

- Restrict allowed origins in the Worker to the Pages domain (e.g. `https://<user>.github.io`) and the Vite dev URL (`http://localhost:5173`) for development.
- Worker should validate the `Origin` header and respond with `403` for unexpected origins.

**7) Security & Operational Checklist**

- Do not commit secrets or KV IDs.
- Use least-privilege for `CF_API_TOKEN`.
- Validate `Origin` header in the Worker.
- Sanitize or escape any content rendered with `innerHTML`.
- Implement robust rate limiting (KV-backed for production) to prevent abuse.
- Implement guardrails to detect and block sensitive or malicious content.
- Monitor Cloudflare and Gemini usage to avoid cost surprises.
- Rotate API keys and tokens periodically.

**8) Rollback and release strategy**

- Frontend: Use Git tags and re-run the Pages deploy on a previous tag or commit.
- Worker: Redeploy a previous commit/tag using the same workflow, or publish from a pinned worker release.

**9) Quick reference commands**
Local dev:

```pwsh
# in project root
npm install
npm install --prefix worker
# run worker (local KV for rate limiting and guardrails active)
npx wrangler dev worker/src/index.ts --local
# run frontend
npm --prefix frontend run dev
```

Create KV (one-time):

```pwsh
npx wrangler kv:namespace create "RATE_LIMIT_KV"
```

Publish worker interactively:

```pwsh
cd worker
npx wrangler deploy
# or in older wrangler versions
npx wrangler publish
```

Set secrets locally for the worker (interactive):

```pwsh
cd worker
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ALLOWED_ORIGINS
```

**10) Next steps I can do for you**

- Create the GitHub Actions workflow file `.github/workflows/deploy.yml` in this repo.
- Add a `worker/wrangler.toml` example (I can create a `wrangler.sample.toml` without secrets).
- Create a short `docs/DEPLOY-SECURITY.md` with hardened production checklist.
