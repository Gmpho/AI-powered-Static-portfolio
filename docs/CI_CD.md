# CI/CD Pipeline: GitHub Pages & Cloudflare Worker Deployment

This document outlines the CI/CD pipeline for this project, which uses GitHub Actions to automatically deploy the static website to GitHub Pages and the AI backend to Cloudflare Workers.

## 🚀 Deployment Workflow

The deployment process is defined in the `.github/workflows/static.yml` file and is triggered on every push to the `main` branch.

### Diagram

```mermaid
graph TD
    A[💻 Local Development] --> B(Git Push to main);
    B --> C{🤖 CI Pipeline (GitHub Actions)};
    C --> D[Checkout Code];
    D --> E[Set up Node.js];
    E --> F[Install Frontend Dependencies];
    F --> G[Build Frontend Project];
    G --> H[Upload Frontend Artifact];
    H --> I[Deploy to GitHub Pages];
    C --> J[Set up Worker Environment];
    J --> K[Install Worker Dependencies];
    K --> L[Deploy Cloudflare Worker];
```

###  Workflow Steps

1.  **Checkout Code:** The workflow begins by checking out the latest code from the `main` branch.
2.  **Set up Node.js:** It sets up the Node.js environment, specifying the long-term support (LTS) version.
3.  **Install Frontend Dependencies:** The command `npm ci` is used in the `frontend/` directory to install the exact versions of the dependencies listed in `package-lock.json`, ensuring a consistent and reliable build.
4.  **Build Frontend Project:** The `npm run build` command is executed in the `frontend/` directory to build the production-ready static files. This typically involves compiling TypeScript, bundling assets, and outputting the result to the `dist` directory.
5.  **Upload Frontend Artifact:** The contents of the `frontend/dist` directory are uploaded as a GitHub Pages artifact.
6.  **Deploy to GitHub Pages:** The final step deploys the uploaded artifact to GitHub Pages, making the new version of the website live.
7.  **Set up Worker Environment:** This step configures the environment for the Cloudflare Worker, including any necessary secrets or API keys.
8.  **Install Worker Dependencies:** The command `npm ci` is used in the `worker/` directory to install the worker's dependencies.
9.  **Deploy Cloudflare Worker:** The `npx wrangler deploy worker/src/index.ts` command is executed from the root of the project to deploy the AI backend to Cloudflare Workers.

This automated workflow ensures that any changes pushed to the `main` branch are quickly and reliably deployed to the live site.