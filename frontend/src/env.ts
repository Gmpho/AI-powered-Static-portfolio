/**
 * env.ts
 * This file provides a read-only mapping for environment variables used in the frontend.
 * It ensures that environment variables are accessed in a consistent and type-safe manner.
 */

interface EnvConfig {
  VITE_WORKER_URL: string;
  VITE_ANALYTICS_ENABLED?: boolean;
  // Add other environment variables here as needed
}

const getWorkerUrl = () => {
    // For local development, always use the local worker URL
    if (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) {
        return 'http://localhost:8787';
    }

    // Get the worker URL that was *intended* at build time.
    const buildTimeWorkerUrl = import.meta.env.VITE_WORKER_URL;

    // If the frontend is currently hosted at the same origin as the worker
    // that was configured at build time, then use a relative path.
    // This handles the scenario where the worker is self-hosting the frontend.
    if (window.location.origin === buildTimeWorkerUrl) {
        return '';
    }

    // Otherwise, use the absolute worker URL provided at build time.
    // This handles scenarios like GitHub Pages where the worker is external.
    return buildTimeWorkerUrl;
}

const env: EnvConfig = {
  VITE_WORKER_URL: getWorkerUrl(),
  VITE_ANALYTICS_ENABLED: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
};

export default env;
