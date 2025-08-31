# Tool Contracts (MCP Server)

The Portfolio Agent has access to a set of tools exposed by the MCP Server. All tool inputs and outputs are strictly validated using Zod schemas.

---

### 1. Resume Analyzer

Analyzes the text of a resume and provides feedback.

-   **Input:** `{ resumeText: string(min:50) }`
-   **Output:** `{ analysis: string, strengths: string[], weaknesses: string[] }`

---

### 2. Pinecone Search

Performs a vector search in a Pinecone index.

-   **Input:** `{ vector: number[], topK: number }`
-   **Output:** `{ matches: { id: string, score: number, metadata: object }[] }`

---

### 3. Notion Query

Queries a database in Notion.

-   **Input:** `{ databaseId: string, filter?: object }`
-   **Output:** `{ results: object[] }`

---

### 4. Project Metadata

Fetches metadata about all portfolio projects.

-   **Input:** `{}`
-   **Output:** `{ projects: { name: string, description: string, url: string }[] }`

---

### 5. Contact Email

Sends a contact email.

-   **Input:** `{ name: string, email: string, message: string }`
-   **Output:** `{ status: "sent" | "failed", info?: string }`
