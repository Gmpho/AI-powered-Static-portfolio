/**
 * frontend/src/i18n.ts
 * Internationalization (i18n) utilities for the frontend.
 * This file provides functions to manage and retrieve translated strings.
 * Simplified to English only as per user request.
 */

// A simple dictionary for English translations
const en: Record<string, string | ((...args: any[]) => string)> = {
  appTitle: "AI-Powered Portfolio",
  heroTitle: "AI-Powered Portfolio",
  heroSubtitle: "Explore my projects and ask questions about them using the AI chatbot.",
  aboutMeTitle: "About Me",
  aboutMeParagraph1: "I am a passionate AI DevOps Engineer with a knack for building intelligent, scalable, and secure applications. My expertise lies in bridging the gap between software development and operations, leveraging AI to automate workflows, optimize performance, and create seamless user experiences.",
  aboutMeParagraph2: "From crafting sophisticated trading bots with Python to developing interactive frontends with TypeScript, I thrive on solving complex problems. Explore my projects below and feel free to ask my AI assistant anything about my work!",
  projectsTitle: "My Projects",
  resumeTitle: "My Resume",
  loadingResume: "Loading resume...",
  failedToLoadResume: "Failed to load resume.",
  chatbotOpen: "Open chat",
  chatbotClose: "Close chat",
  chatbotTitle: "AI Assistant",
  chatbotPlaceholder: "Ask about my projects...",
  chatbotMic: "Use microphone",
  chatbotSend: "Send message",
  chatbotStop: "Stop generating",
  contactFormTitle: "Contact Form",
  contactFormIntro: "Sure! Please fill out the form below and I'll send the message for you.",
  contactNameLabel: "Name",
  contactEmailLabel: "Email",
  contactMessageLabel: "Message",
  contactSendButton: "Send Message",
  contactSending: "Sending your message...",
  contactSuccess: (name: string) => `Thanks, ${name}! Your message has been sent. I'll be in touch soon.`,
  contactError: (info: string) => `Sorry, there was an error: ${info}. Please try again.`,
  chatbotErrorConnecting: (error: string) => `Oops! I'm having trouble connecting: ${error}. Please try again in a moment.`,
  themeToggleLight: "Switch to light mode",
  themeToggleDark: "Switch to dark mode",
  methodNotAllowed: "Method Not Allowed",
  invalidContactFormData: "Invalid contact form data",
  turnstileTokenMissing: "Turnstile token missing.",
  invalidTurnstileToken: "Invalid Turnstile token. Please try again.",
  errorProcessingContactForm: "Error processing contact form submission:",
  resumeEndpointError: "Sorry, I’m having trouble retrieving the resume right now.",
  embeddingEndpointError: "Sorry, I’m having trouble generating the embedding right now.",
  chatEndpointError: "Sorry, I’m having trouble answering that right now.",
  aiModelOverloaded: "AI model overloaded or unavailable. Please try again later.",
  geminiStreamNoData: "Gemini stream returned no data.",
  streamError: (message: string) => `Stream error: ${message}`,
  failedToSendPrompt: "Failed to send prompt to worker:",
  unknownErrorAI: "An unknown error occurred while trying to communicate with the AI.",
  configurationErrorWorkerUrl: "Configuration error: VITE_WORKER_URL is not set. Please check your frontend/.env.local file.",
  missingServerConfiguration: "Missing server configuration",
  invalidTextInRequestBody: "Invalid text in request body",
  cannotProcessRequest: "I am sorry, I cannot process that request.",
  // Project-specific strings
  "project.ai-powered-portfolio.title": "AI-Powered Portfolio",
  "project.ai-powered-portfolio.summary": "This very portfolio, featuring a Gemini-powered chatbot.",
  "project.ai-powered-portfolio.description": "A portfolio website with a TypeScript-powered AI chatbot to answer questions about my work.",
  "project.crypto-pulse-ai.title": "Crypto Pulse AI",
  "project.crypto-pulse-ai.summary": "AI-powered trading bot dashboard for Binance.",
  "project.crypto-pulse-ai.description": "A modern dashboard for an AI-powered trading bot that automates Binance spot trading with advanced risk management and multi-platform control.",
  "project.student-programming-hub.title": "Student Programming Hub",
  "project.student-programming-hub.summary": "A modern, secure educational platform for students.",
  "project.student-programming-hub.description": "An educational platform for students to learn HTML, programming, and web development, built with enterprise-grade security and modern web technologies.",
  "project.build-bear-ai-trading-bot.title": "Build Bear: AI Trading Bot",
  "project.build-bear-ai-trading-bot.summary": "AI-powered trading bot for Binance with multi-platform control.",
  "project.build-bear-ai-trading-bot.description": "An advanced Binance trading bot that leverages artificial intelligence for automated trading strategies, featuring a Next.js frontend and Python backend.",
  "project.instagram-automation-bot.title": "Instagram Automation Bot",
  "project.instagram-automation-bot.summary": "Workflow automation bot for Instagram using n8n and dual AIs.",
  "project.instagram-automation-bot.description": "An advanced Instagram automation bot using n8n with dual AI support (Claude + OpenAI) for intelligent content generation, research, and optimization.",
  // Contact form keywords
  contact: "contact",
  contactForm: "contact form",
  sendEmail: "send email",
  messageMe: "message me",
  getInTouch: "get in touch",
  loadMore: "Load More",
};

export function getTranslation(key: string, ...args: (string | number)[]): string {
  const value = en[key];

  if (typeof value === 'function') {
    return value(...args);
  } else if (typeof value === 'string') {
    return value;
  } else {
    console.warn(`Translation key '${key}' not found or is not a string/function.`);
    return key; // Return the key itself if not found or invalid
  }
}

// No need for setLanguage or browser language detection if only English is supported.
// document.documentElement.lang can be set directly in index.html or left as default.

