import { GoogleGenAI, Chat } from "@google/genai";

const projects = [
  {
    title: "AI Resume Analyzer",
    description:
      "Upload a PDF resume and receive improvement suggestions based on common best practices.",
    tags: ["TypeScript", "pdf.js", "regex"],
  },
  {
    title: "AI-Powered Portfolio",
    description:
      "A portfolio website with a TypeScript-powered AI chatbot to answer questions about my work.",
    tags: ["TypeScript", "Gemini API", "UI/UX"],
  },
  {
    title: "E-commerce Platform",
    description:
      "A full-stack e-commerce site with features like product search, cart management, and secure payments.",
    tags: ["React", "Node.js", "PostgreSQL", "Stripe"],
  },
];

const projectsContext = `
You are a helpful and friendly AI assistant for a personal portfolio website.
Your goal is to answer questions about the projects listed below.
Be enthusiastic and professional. Keep your answers concise.
Format your responses using simple markdown.

Here is the list of projects:
${projects
  .map(
    (p) =>
      `- **${p.title}**: ${p.description} (Technologies: ${p.tags.join(
        ", ",
      )})`,
  )
  .join("\n")}
`;

// DOM Elements
const projectsContainer = document.querySelector(".projects");
const fab = document.getElementById("chatbot-fab");
const chatWindow = document.getElementById("chatbot-window");
const closeBtn = document.getElementById("chatbot-close");
const chatMessages = document.getElementById("chatbot-messages");
const chatForm = document.getElementById("chatbot-form");
const chatInput = document.getElementById("chatbot-input") as HTMLInputElement;
const sendBtn = document.getElementById("chatbot-send") as HTMLButtonElement;


let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

/**
 * Initializes the Gemini AI client and chat session.
 */
function initializeAI() {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: projectsContext,
      },
    });
    addBotMessage("Hi there! How can I help you explore these projects?");
  } catch (error) {
    console.error("Failed to initialize AI:", error);
    addBotMessage("Sorry, the AI assistant is currently unavailable.");
    if(chatInput) chatInput.disabled = true;
    if(sendBtn) sendBtn.disabled = true;
  }
}

/**
 * Renders project cards to the DOM.
 */
function renderProjects() {
  if (!projectsContainer) return;
  projectsContainer.innerHTML = projects
    .map(
      (project) => `
    <div class="project-card">
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <div class="project-tags">
        ${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    </div>
  `,
    )
    .join("");
}

/**
 * Toggles the visibility of the chatbot window.
 */
function toggleChatWindow() {
  chatWindow?.classList.toggle("visible");
  const isVisible = chatWindow?.classList.contains("visible");
  chatWindow?.setAttribute('aria-hidden', String(!isVisible));
  if (isVisible) {
      chatInput?.focus();
  }
}

/**
 * Adds a message to the chat UI.
 * @param {string} text The message text.
 * @param {'user' | 'bot' | 'loading'} sender The sender of the message.
 * @returns {HTMLElement} The created message bubble element.
 */
function addMessage(text: string, sender: 'user' | 'bot' | 'loading'): HTMLElement {
  if (!chatMessages) return document.createElement('div');

  const messageElement = document.createElement("div");
  messageElement.className = `message ${sender}`;
  
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (sender === 'loading') {
      bubble.innerHTML = '<div class="dot-flashing"></div>';
  } else {
      // A simple text-only sanitization
      bubble.textContent = text;
  }
  
  messageElement.appendChild(bubble);
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

/**
 * Adds a bot message to the chat.
 * @param {string} text The message from the bot.
 */
function addBotMessage(text: string) {
    addMessage(text, 'bot');
}

/**
 * Adds a user message to the chat.
 * @param {string} text The message from the user.
 */
function addUserMessage(text: string) {
    addMessage(text, 'user');
}


/**
 * Handles the chat form submission.
 * @param {Event} e The form submission event.
 */
async function handleFormSubmit(e: Event) {
  e.preventDefault();
  if (!chat || !chatInput || chatInput.value.trim() === "") return;

  const userMessage = chatInput.value.trim();
  addUserMessage(userMessage);
  chatInput.value = "";
  sendBtn.disabled = true;
  
  const loadingBubble = addMessage('', 'loading');

  try {
    const stream = await chat.sendMessageStream({ message: userMessage });

    loadingBubble.parentElement?.remove(); // Remove loading indicator
    const botBubble = addMessage('', 'bot');
    let botResponse = '';

    for await (const chunk of stream) {
      botResponse += chunk.text;
      botBubble.textContent = botResponse;
      if(chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    loadingBubble.parentElement?.remove();
    addBotMessage("I'm having trouble connecting right now. Please try again later.");
  } finally {
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

// Event Listeners
fab?.addEventListener("click", toggleChatWindow);
closeBtn?.addEventListener("click", toggleChatWindow);
chatForm?.addEventListener("submit", handleFormSubmit);

chatInput?.addEventListener('input', () => {
    if (sendBtn) {
        sendBtn.disabled = chatInput.value.trim() === '';
    }
});


// Initial calls
document.addEventListener("DOMContentLoaded", () => {
  renderProjects();
  initializeAI();
});
