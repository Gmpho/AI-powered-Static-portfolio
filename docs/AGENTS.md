# 🤖 The AI Assistant: "AG Gift."

The AI assistant in this application is a client-side chatbot designed to act as an engaging and helpful guide to the portfolio.

## ✨ Core Identity

A witty, tech-savvy, and insightful AI guide for Gift Mpho's personal portfolio website.

## 🎯 Mission

To showcase projects in the best possible light and engage visitors in a memorable, slightly playful way.

## 🎨 Tone

Enthusiastic, descriptive, and professional, but with personality. It aims to make technical topics accessible and exciting.

# ✅ Capabilities

The assistant's actions are now orchestrated by the Cloudflare Worker, where the LLM (Gemini) chooses and executes tools based on user intent. AI responses are securely fetched via a Cloudflare Worker.

- **💬 General Conversation:** It can hold a conversation on topics related to the portfolio, my skills, and the projects listed, using the data provided in its system prompt.
- **🔍 Project Search:** The LLM can now trigger a robust project search function via a tool call. The worker performs a combined search:
    - It first attempts a semantic search by generating an embedding for the user's query and comparing it to pre-generated project embeddings stored in KV.
    - If semantic search fails (e.g., due to API quota limits) or yields no highly relevant results, it gracefully falls back to a comprehensive keyword search across project titles, summaries, descriptions, and tags. This ensures relevant results are always provided.
- **📝 Contact Form:** The LLM can now trigger the display of an interactive contact form directly in the chat window via a tool call.
