
export interface Env {
    GEMINI_API_KEY: string;
    ALLOWED_ORIGINS?: string;
    RATE_LIMIT_KV: KVNamespace;
    PROJECT_EMBEDDINGS_KV?: KVNamespace;
    GEMINI_SYSTEM_PROMPT: string;
}

/**
 * Defines the structure for the resume summary object.
 */
export interface ResumeSummary {
  title: string;
  experience: string;
  skills: string[];
}

/**
 * Defines the structure for the JSON response from the /resume endpoint.
 */
export interface ResumeResponse {
  summary: ResumeSummary;
  downloadUrl: string;
}
