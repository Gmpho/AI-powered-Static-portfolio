export interface Env {
    GEMINI_API_KEY: string;
    ALLOWED_ORIGINS?: string;
    RATE_LIMIT_KV: KVNamespace;
    PROJECT_EMBEDDINGS_KV?: KVNamespace;
}
