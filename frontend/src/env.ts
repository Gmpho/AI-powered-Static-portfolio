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
    if (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) {
        return 'http://localhost:8787';
    }
    return import.meta.env.VITE_WORKER_URL;
}

const env: EnvConfig = {
  VITE_WORKER_URL: getWorkerUrl(),
  VITE_ANALYTICS_ENABLED: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
};

export default env;
