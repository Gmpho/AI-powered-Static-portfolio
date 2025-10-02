// --- Interfaces ---
export interface Project {
  title: string;
  description: string;
  tags: string[];
  url: string;
}

// --- Project Data ---
export const projects: Project[] = [
  {
    title: "AI Resume Analyzer",
    description:
      "Upload a PDF resume and receive improvement suggestions based on common best practices.",
    tags: ["TypeScript", "pdf.js", "regex"],
    url: "https://github.com/example/resume-analyzer",
  },
  {
    title: "AI-Powered Portfolio",
    description:
      "A portfolio website with a TypeScript-powered AI chatbot to answer questions about my work.",
    tags: ["TypeScript", "Gemini API", "UI/UX"],
    url: "https://github.com/example/ai-portfolio",
  },
  {
    title: "E-commerce Platform",
    description:
      "A full-stack e-commerce site with features like product search, cart management, and secure payments.",
    tags: ["React", "Node.js", "PostgreSQL", "Stripe"],
    url: "https://github.com/example/ecommerce-platform",
  },
];
