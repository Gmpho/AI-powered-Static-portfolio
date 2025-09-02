

import { sendPrompt } from "./frontend/chatbot";


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


// --- Project Data (Hardcoded for now) ---
interface Project {
  title: string;
  description: string;
  tags: string[];
  url: string;
}

const projects: Project[] = [
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

/**
 * Renders project cards into the projects container.
 */
async function renderProjects() {
  if (!projectsContainer) return;
  projectsContainer.innerHTML = projects
    .map(
      (project) => `
    <a href="${project.url}" target="_blank" rel="noopener noreferrer" class="project-card-link">
        <div class="project-card">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="project-tags">
            ${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
        </div>
    </a>
  `,
    )
    .join("");
}

/**
 * Adds a message to the chat window.
 * @param {string} text - The message text to display.
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
     // Basic markdown for links ([text](url))
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
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
    return addMessage(text, 'bot');
}

/**
 * Adds a message from the user to the chat window.
 * @param {string} text - The user's message text.
 */
function addUserMessage(text: string) {
    addMessage(text, 'user');
}

/**
 * Creates and displays the contact form within the chat window.
 */
function displayContactForm() {
    const formContainer = document.createElement('div');
    formContainer.className = 'contact-form-container';
    formContainer.innerHTML = `
        <p>Sure! Please fill out the form below and I'll send the message for you.</p>
        <form id="chatbot-contact-form" aria-labelledby="contact-form-title">
            <h4 id="contact-form-title" class="sr-only">Contact Form</h4>
            <div>
                <label for="contact-name">Name</label>
                <input type="text" id="contact-name" name="name" required autocomplete="name" />
            </div>
            <div>
                <label for="contact-email">Email</label>
                <input type="email" id="contact-email" name="email" required autocomplete="email" />
            </div>
            <div>
                <label for="contact-message">Message</label>
                <textarea id="contact-message" name="message" rows="4" required></textarea>
            </div>
            <button type="submit" class="contact-submit-btn">Send Message</button>
        </form>
    `;

    const formMessageEl = addMessage(formContainer.outerHTML, 'bot'); // Pass outerHTML to addMessage

    const form = formContainer.querySelector('#chatbot-contact-form') as HTMLFormElement;
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.contact-submit-btn') as HTMLButtonElement;
            if (!submitBtn) return;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const formData = new FormData(form);
            const name = formData.get('name') as string;
            const email = formData.get('email') as string;
            const message = formData.get('message') as string;
            
            // Remove form from chat window while processing
            formMessageEl.remove();
            addMessage("Sending your message...", "loading");

            // Simulate sending email via worker (replace with actual worker call)
            const result: { status: 'sent' | 'failed', info?: string } = { status: 'sent' }; // Placeholder
            
            if (result.status === 'sent') {
                addBotMessage("Thanks! Your message has been sent successfully. We'll be in touch soon.");
            } else {
                addBotMessage(`Sorry, there was an error: ${result.info || 'Unknown error'}. Please try again.`);
            }
        });
    }
}


/**
 * Handles the chat form submission. It orchestrates between search, contact form, and conversational chat.
 * @param {Event} e - The form submission event.
 */
async function handleChatSubmit(e: Event) {
  e.preventDefault();
  if (!chatInput || chatInput.value.trim() === "") return;

  const userMessage = chatInput.value.trim();
  addUserMessage(userMessage);
  chatInput.value = "";
  if(sendBtn) sendBtn.disabled = true;

  // Contact form orchestration logic
  const contactKeywords = ['contact', 'email', 'message', 'send a message'];
  if (contactKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
    displayContactForm();
    return;
  }

  // Fallback to conversational chat (now using the worker)
  addMessage("Thinking...", "loading");
  try {
    const botResponseText = await sendPrompt(userMessage);
    addBotMessage(botResponseText);
  } catch (error) {
    console.error("Chatbot error:", error);
    addBotMessage("Oops! I seem to be having a little trouble. Please try again in a moment.");
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
// micBtn?.addEventListener('click', toggleSpeechRecognition); // Removed for now, as it requires more setup

// Add event listener for theme toggle
themeToggleBtn?.addEventListener('click', handleThemeToggle);

// --- Initialization ---

// When the DOM is fully loaded, render the project cards.
document.addEventListener("DOMContentLoaded", async () => {
  await renderProjects();
  // No AI initialization here, as it's handled by the worker
});