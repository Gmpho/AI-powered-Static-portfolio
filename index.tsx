import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";

// Fix: Add type definitions for the Web Speech API to resolve TypeScript errors.
// The Web Speech API is experimental and types may not be in default TS lib files.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
  
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

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
const micBtn = document.getElementById("chatbot-mic") as HTMLButtonElement;


let ai: GoogleGenerativeAI | null = null;
let chat: ChatSession | null = null;

// --- Speech Recognition Setup ---
// FIX: Renamed constant to avoid conflict with the global SpeechRecognition type.
const SpeechRecognitionAPI =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: SpeechRecognition | null = null;
let isRecording = false;

if (SpeechRecognitionAPI) {
  recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = true;

  recognition.onstart = () => {
    isRecording = true;
    if (micBtn) {
      micBtn.classList.add('is-recording');
      micBtn.setAttribute('aria-label', 'Stop recording');
      micBtn.innerHTML = '<i class="fas fa-stop"></i>';
    }
    if (chatInput) {
      chatInput.placeholder = 'Listening...';
    }
  };

  recognition.onend = () => {
    isRecording = false;
    if (micBtn) {
      micBtn.classList.remove('is-recording');
      micBtn.setAttribute('aria-label', 'Use microphone');
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    }
    if (chatInput) {
      chatInput.placeholder = 'Ask about my projects...';
    }
    if (sendBtn && chatInput) {
        sendBtn.disabled = chatInput.value.trim() === '';
    }
  };
  
  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    if (chatInput) {
      chatInput.value = transcript;
    }
    if (sendBtn && chatInput) {
        sendBtn.disabled = chatInput.value.trim() === '';
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      addBotMessage("I need permission to use your microphone. Please enable it in your browser settings.");
      if (micBtn) {
        micBtn.disabled = true;
      }
    } else if (event.error === 'network') {
      addBotMessage("Sorry, I'm having trouble connecting to the speech service. Please check your internet connection and try again.");
    } else {
      addBotMessage("Sorry, an unknown error occurred with speech recognition. Please try again.");
    }
  };
} else {
  console.warn("Speech Recognition API not supported in this browser.");
  if (micBtn) micBtn.style.display = 'none';
}

/**
 * Toggles the speech recognition on and off.
 */
function toggleSpeechRecognition() {
    if (!recognition) return;

    if (isRecording) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (e) {
            console.error("Could not start recognition:", e);
            addBotMessage("Sorry, I couldn't start listening. Please try again.");
        }
    }
}


/**
 * Initializes the Gemini AI client and chat session.
 */
function initializeAI() {
  try {
    ai = new GoogleGenerativeAI(process.env.API_KEY as string);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: projectsContext });
    chat = model.startChat();
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
    const result = await chat.sendMessageStream(userMessage);

    loadingBubble.parentElement?.remove(); // Remove loading indicator
    const botBubble = addMessage('', 'bot');
    let botResponse = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      botResponse += chunkText;
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
micBtn?.addEventListener("click", toggleSpeechRecognition);

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
