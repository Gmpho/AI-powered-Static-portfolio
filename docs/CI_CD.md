#  CI/CD Pipeline: GitHub Pages Deployment

This document outlines the CI/CD pipeline for this project, which uses GitHub Actions to automatically deploy the static website to GitHub Pages.

## 🚀 Deployment Workflow

The deployment process is defined in the `.github/workflows/static.yml` file and is triggered on every push to the `main` branch.

### Diagram

```mermaid
graph TD
    A[💻 Local Development] --> B(Git Push to main);
    B --> C{🤖 CI Pipeline (GitHub Actions)};
    C --> D[Checkout Code];
    D --> E[Set up Node.js];
    E --> F[Install Dependencies];
    F --> G[Build Project];
    G --> H[Upload Artifact];
    H --> I[Deploy to GitHub Pages];
```

###  Workflow Steps

1.  **Checkout Code:** The workflow begins by checking out the latest code from the `main` branch.
2.  **Set up Node.js:** It sets up the Node.js environment, specifying the long-term support (LTS) version.
3.  **Install Dependencies:** The command `npm ci` is used to install the exact versions of the dependencies listed in `package-lock.json`, ensuring a consistent and reliable build.
4.  **Build Project:** The `npm run build` command is executed to build the production-ready static files. This typically involves compiling TypeScript, bundling assets, and outputting the result to the `dist` directory.
5.  **Upload Artifact:** The contents of the `dist` directory are uploaded as a GitHub Pages artifact.
6.  **Deploy to GitHub Pages:** The final step deploys the uploaded artifact to GitHub Pages, making the new version of the website live.

This automated workflow ensures that any changes pushed to the `main` branch are quickly and reliably deployed to the live site.