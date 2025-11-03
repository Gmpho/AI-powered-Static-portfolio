// --- Type Definitions ---
export interface Project {
  id: string;
  titleKey: string; // Changed to key for i18n
  summaryKey: string; // Changed to key for i18n
  descriptionKey: string; // Changed to key for i18n
  tags: string[];
  url: string;
}

/**
 * The hardcoded data source for projects. In a real-world scenario, this would
 * live in a database or a CMS and be fetched by the MCP server tool.
 * @type {Array<Project>}
 */
export const projects: Project[] = [
  {
    id: "ai-powered-portfolio",
    titleKey: "project.ai-powered-portfolio.title",
    summaryKey: "project.ai-powered-portfolio.summary",
    descriptionKey: "project.ai-powered-portfolio.description",
    tags: [
      "TypeScript",
      "Vite",
      "HTML5 + CSS3",
      "GoogleGenai",
      "PlayWright",
      "Gemini API",
      "UI/UX",
      "Zod",
      "Cloudflare Serverless Backend",
      "Github pages",
      "AI Devops Engineer",
    ],
    url: "https://github.com/Gmpho/AI-powered-Static-portfolio",
  },
  {
    id: "crypto-pulse-ai",
    titleKey: "project.crypto-pulse-ai.title",
    summaryKey: "project.crypto-pulse-ai.summary",
    descriptionKey: "project.crypto-pulse-ai.description",
    tags: [
      "Python",
      "Docker",
      "TypeScript",
      "Vite",
      "Tailwindcss",
      "React",
      "Gemini",
      "OpenAI",
      "Web3",
      "Binance",
      "cryptocurrency",
      " coingecko-api",
      "genai-chatbot",
      "Fly.io",
      "OpenRouter",
      "Zod",
      "Ollama",
      "Open-Source",
      "Model Context Protocol (MCP)",
      " GitHub Actions",
      "Supabase (PostgreSQL + pgvector)",
      "FastAPI, LangChain Agent Executor, Pydantic",
    ],
    url: "https://github.com/Gmpho/Crypto_pulse_AI",
  },
  {
    id: "student-programming-hub",
    titleKey: "project.student-programming-hub.title",
    summaryKey: "project.student-programming-hub.summary",
    descriptionKey: "project.student-programming-hub.description",
    tags: [
      "TypeScript",
      "HTML",
      "CSS",
      "Vite",
      "Supabase",
      "Security",
      "JavaScript",
      "Python",
      "Shell",
      "Docker",
    ],
    url: "https://github.com/Gmpho/html-crash-course",
  },
  {
    id: "build-bear-ai-trading-bot",
    titleKey: "project.build-bear-ai-trading-bot.title",
    summaryKey: "project.build-bear-ai-trading-bot.summary",
    descriptionKey: "project.build-bear-ai-trading-bot.description",
    tags: [
      "Python",
      "Next.js",
      "LangChain",
      "Supabase",
      "Docker",
      "Notion Integration",
      "OpenRouter",
      "Ollama LLM",
      "Binance API",
      "Pinecone VectorDB",
      "FastAPI, LangChain,",
    ],
    url: "https://github.com/Gmpho/build-bear",
  },
  {
    id: "instagram-automation-bot",
    titleKey: "project.instagram-automation-bot.title",
    summaryKey: "project.instagram-automation-bot.summary",
    descriptionKey: "project.instagram-automation-bot.description",
    tags: [
      "Python",
      "n8n",
      "Docker",
      "Claude AI",
      "OpenAI",
      "Automation",
      "Shell",
      "Powershell",
    ],
    url: "https://github.com/Gmpho/autmation-tasks",
  },
];