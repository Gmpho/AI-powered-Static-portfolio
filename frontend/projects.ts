// --- Type Definitions ---
export interface Project {
  id: string;
  title: string;
  summary: string;
  description: string;
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
    title: "AI-Powered Portfolio",
    summary: "This very portfolio, featuring a Gemini-powered chatbot.",
    description:
      "A portfolio website with a TypeScript-powered AI chatbot to answer questions about my work.",
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
    title: "Crypto Pulse AI",
    summary: "AI-powered trading bot dashboard for Binance.",
    description:
      "A modern dashboard for an AI-powered trading bot that automates Binance spot trading with advanced risk management and multi-platform control.",
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
    title: "Student Programming Hub",
    summary: "A modern, secure educational platform for students.",
    description:
      "An educational platform for students to learn HTML, programming, and web development, built with enterprise-grade security and modern web technologies.",
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
    title: "Build Bear: AI Trading Bot",
    summary: "AI-powered trading bot for Binance with multi-platform control.",
    description:
      "An advanced Binance trading bot that leverages artificial intelligence for automated trading strategies, featuring a Next.js frontend and Python backend.",
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
    title: "Instagram Automation Bot",
    summary: "Workflow automation bot for Instagram using n8n and dual AIs.",
    description:
      "An advanced Instagram automation bot using n8n with dual AI support (Claude + OpenAI) for intelligent content generation, research, and optimization.",
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