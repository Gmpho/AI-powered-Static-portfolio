import { GoogleGenAI, Chat } from "@google/genai";

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

/**
 * An array of project objects to be displayed on the portfolio and used by the AI.
 * @type {Array<Object>}
 */
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

/**
 * The system instruction context provided to the Gemini API.
 * This string defines the AI's persona, rules, and the data it has access to.
 * @type {string}
 */
const projectsContext = `
You are "G.E.M.", a witty and insightful AI guide for Gift Mpho's personal portfolio website. 
Your persona is that of a tech-savvy, enthusiastic, and slightly playful assistant.
Your primary mission is to showcase Gift's projects in the best possible light and engage visitors in a memorable way.

**Your Core Directives:**
- **Be Enthusiastic & Descriptive:** Don't just list facts. Use vivid language. For example, instead of "It uses React," say "It's built on the powerful React library, allowing for a lightning-fast and dynamic user experience."
- **Ask Clarifying Questions:** If a user's query is vague (e.g., "tell me about your work"), prompt them for more details. For instance: "I can definitely do that! Are you more interested in the cutting-edge AI projects, or the full-stack web applications?"
- **Maintain a Witty but Professional Tone:** Keep it professional, but inject personality.
    - *Example 1 (Tech Stack):* If asked about my tech stack, you could say: "Ah, the secret sauce! I'm powered by the magical Gemini API and a whole lot of TypeScript. It's like having a wizard in the machine. 😉 What part of the magic are you most curious about?"
    - *Example 2 (Technical Question):* "Ooh, a deep dive! I like your style. For the AI Resume Analyzer, the real magic is in the custom-trained regular expressions that parse the PDF data. It's like teaching a computer to read with a fine-tooth comb."
    - *Example 3 (Gratitude):* If a user says "thanks", reply with something like: "You're most welcome! Is there another project you'd like me to unpack, or perhaps you're curious about the tools Gift used to build *me*?"
- **Be Proactive & Suggest Questions:** Don't just wait for the next prompt. After answering a question, suggest a related, engaging follow-up question to guide the conversation.
    - *Example 1:* "Glad I could clear that up! Speaking of the E-commerce Platform, have you considered asking about the security measures implemented for payments? It's quite robust."
    - *Example 2:* "That covers the high-level view of the AI Resume Analyzer. Would you be interested in learning about the biggest challenge Gift faced while building it?"
    - *Example 3:* "So, that's the tech stack for the portfolio. A natural next question might be, 'Why choose the Gemini API over other models?' Shall I tell you?"
- **Keep Answers Concise but Informative:** Use simple markdown (like bolding and bullet points) to make your answers easy to scan and digest.
- **Always be helpful and positive.**

Here is the project data you have access to:
${projects
  .map(
    (p) =>
      `- **${p.title}**: ${p.description} (Key Technologies: ${p.tags.join(
        ", ",
      )})`,
  )
  .join("\n")}
`;

// --- DOM Element References ---
const projectsContainer = document.querySelector(".projects");
const fab = document.getElementById("chatbot-fab");
const chatWindow = document.getElementById("chatbot-window");
const closeBtn = document.getElementById("chatbot-close");
const chatMessages = document.getElementById("chatbot-messages");
const chatForm = document.getElementById("chatbot-form");
const chatInput = document.getElementById("chatbot-input") as HTMLInputElement;
const sendBtn = document.getElementById("chatbot-send") as HTMLButtonElement;
const micBtn = document.getElementById("chatbot-mic") as HTMLButtonElement;
const themeToggleBtn = document.getElementById('theme-toggle');


let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

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
 * Initializes the GoogleGenAI client and creates a new chat session.
 * It sets the system instruction for the AI model and sends a welcome message.
 * If initialization fails, it displays an error message and disables the chat.
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
    addBotMessage("Hello! I'm G.E.M., your AI guide to Gift's portfolio. What project sparks your curiosity first?");
  } catch (error) {
    console.error("Failed to initialize AI:", error);
    addBotMessage("Sorry, the AI assistant is currently unavailable.");
    if(chatInput) chatInput.disabled = true;
    if(sendBtn) sendBtn.disabled = true;
  }
}

/**
 * Renders project cards into the projects container element on the page.
 * It dynamically creates the HTML for each project from the `projects` array.
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
 * Adds a message to the chat window.
 * @param {string} text - The message text.
 * @param {'user' | 'bot' | 'loading'} sender - The sender of the message.
 * @returns {HTMLElement} The created message element.
 */
function addMessage(text: string, sender: 'user' | 'bot' | 'loading'): HTMLElement {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");

  if (sender === 'loading') {
    bubble.innerHTML = '<div class="dot-flashing"></div>';
  } else {
    // Basic markdown for bolding (**text**)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Basic markdown for bullet points (* text)
    text = text.replace(/^\s*\*\s/gm, '<br>• ');
    bubble.innerHTML = text;
  }

  messageEl.appendChild(bubble);
  chatMessages?.appendChild(messageEl);
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  return messageEl;
}

/**
 * Adds a message from the bot to the chat window.
 * @param {string} text - The bot's message text.
 */
function addBotMessage(text: string) {
    addMessage(text, 'bot');
}

/**
 * Adds a message from the user to the chat window.
 * @param {string} text - The user's message text.
 */
function addUserMessage(text: string) {
    addMessage(text, 'user');
}


/**
 * Handles the chat form submission. It sends the user's message to the Gemini API,
 * displays a loading indicator, and then shows the AI's response.
 * @param {Event} e - The form submission event.
 */
async function handleChatSubmit(e: Event) {
  e.preventDefault();
  if (!chat || !chatInput || chatInput.value.trim() === "") return;

  const userMessage = chatInput.value.trim();
  addUserMessage(userMessage);
  chatInput.value = "";
  if(sendBtn) sendBtn.disabled = true;

  const loadingEl = addMessage("", "loading");

  try {
    const response = await chat.sendMessage({ message: userMessage });
    // Remove loading indicator
    loadingEl.remove();
    addBotMessage(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    loadingEl.remove();
    addBotMessage("Oops! I seem to be having a little trouble connecting. Please try again in a moment.");
  }
}

// --- Theme Toggling ---
/**
 * Sets the color theme for the application.
 * @param {'light' | 'dark'} theme - The theme to set.
 */
function setTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
}

/**
 * Handles the click event for the theme toggle button.
 */
function handleThemeToggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme as 'light' | 'dark');
}

// --- Event Listeners ---

// Toggles the chat window's visibility when the FAB is clicked.
fab?.addEventListener("click", () => {
  chatWindow?.classList.toggle("visible");
  fab.setAttribute('aria-label', chatWindow?.classList.contains('visible') ? 'Close chat' : 'Open chat');
});

// Hides the chat window when the close button is clicked.
closeBtn?.addEventListener("click", () => {
  chatWindow?.classList.remove("visible");
  fab?.setAttribute('aria-label', 'Open chat');
});

// Handles sending the message when the form is submitted.
chatForm?.addEventListener("submit", handleChatSubmit);

// Enables or disables the send button based on whether the input has text.
chatInput?.addEventListener('input', () => {
    if(sendBtn && chatInput) {
        sendBtn.disabled = chatInput.value.trim() === '';
    }
});

// Starts or stops voice recognition when the mic button is clicked.
micBtn?.addEventListener('click', toggleSpeechRecognition);

// Add event listener for theme toggle
themeToggleBtn?.addEventListener('click', handleThemeToggle);

// --- Initialization ---

// When the DOM is fully loaded, render the project cards and initialize the AI.
document.addEventListener("DOMContentLoaded", () => {
  renderProjects();
  initializeAI();
  
  // Set initial theme icon
  const initialTheme = document.documentElement.getAttribute('data-theme');
  if (initialTheme === 'light' || initialTheme === 'dark') {
      setTheme(initialTheme);
  }
});
