import { sendPrompt } from "./chatbot";

interface ContactFormWorkerResponse {
  status: "sent" | "failed";
  info?: string;
}

async function sendContactFormToWorker(
  name: string,
  email: string,
  message: string,
): Promise<ContactFormWorkerResponse> {
  const workerUrl = import.meta.env.VITE_WORKER_URL;

  if (!workerUrl) {
    console.error("Configuration error: VITE_WORKER_URL is not set.");
    return { status: "failed", info: "Configuration error" };
  }

  try {
    const response = await fetch(`${workerUrl}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    const data: ContactFormWorkerResponse = await response.json();

    if (!response.ok) {
      return {
        status: "failed",
        info: data.info || `Request failed with status ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("Failed to send contact form to worker:", error);
    return { status: "failed", info: "Network error or worker unavailable" };
  }
}

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
const themeToggleBtn = document.getElementById("theme-toggle");

// --- Constants ---
const CHAT_HISTORY_KEY = "chatHistory";

import { projects } from "./projects";

// --- Interfaces ---
interface ChatMessage {
  text: string;
  sender: "user" | "bot";
}

/**
 * Renders project cards into the projects container.
 */
async function renderProjects() {
  // ... (renderProjects function remains the same)
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
function addMessage(
  text: string,
  sender: "user" | "bot" | "loading",
): HTMLElement {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");

  if (sender === "loading") {
    bubble.innerHTML = '<div class="dot-flashing"></div>'; // This is safe as it's a fixed, internal string
  } else {
    // Check if the text contains HTML tags. If so, render directly.
    if (/<[a-z][\s\S]*>/i.test(text)) {
      bubble.innerHTML = text; // Render HTML directly
    } else {
      // Securely parse and render the text content as markdown
      const lines = text.split("\n");
      lines.forEach((line, index) => {
        if (index > 0) bubble.appendChild(document.createElement("br"));

        // Basic markdown for bullet points (* text)
        const bulletMatch = line.match(/^\s*\*\s(.*)/);
        if (bulletMatch) {
          const li = document.createElement("ul");
          li.style.paddingLeft = "20px";
          const item = document.createElement("li");
          item.textContent = bulletMatch[1];
          li.appendChild(item);
          bubble.appendChild(li);
          return; // Continue to next line
        }

        // Regex to split by markdown links and bold text
        const regex = /(\*\*.*?\*\*)|(\[.*?\]\(.*?\))/g;
        const parts = line.split(regex).filter((part) => part);

        parts.forEach((part) => {
          // Bold text: **text**
          if (part.startsWith("**") && part.endsWith("**")) {
            const strong = document.createElement("strong");
            strong.textContent = part.slice(2, -2);
            bubble.appendChild(strong);
          }
          // Link: [text](url)
          else if (part.startsWith("[") && part.includes("](")) {
            const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
              const a = document.createElement("a");
              a.textContent = linkMatch[1];
              a.href = linkMatch[2];
              a.target = "_blank";
              a.rel = "noopener noreferrer";
              bubble.appendChild(a);
            }
          } else {
            bubble.appendChild(document.createTextNode(part));
          }
        });
      });
    }
  }

  messageEl.appendChild(bubble);
  chatMessages?.appendChild(messageEl);
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  return messageEl;
}

/**
 * Saves the current chat history to localStorage.
 */
function saveChatHistory() {
  if (!chatMessages) return;
  const messages: ChatMessage[] = Array.from(chatMessages.children)
    .filter(
      (el) => el.classList.contains("user") || el.classList.contains("bot"),
    )
    .map((el) => ({
      text: (el.querySelector(".message-bubble") as HTMLElement).innerHTML,
      sender: el.classList.contains("user") ? "user" : "bot",
    }));
  sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
}

/**
 * Loads chat history from sessionStorage and displays it.
 */
function loadChatHistory() {
  const savedHistory = sessionStorage.getItem(CHAT_HISTORY_KEY);
  if (savedHistory) {
    const messages: ChatMessage[] = JSON.parse(savedHistory);
    messages.forEach((msg) => {
      const messageEl = addMessage(msg.text, msg.sender);
      // We need to re-set the innerHTML because our addMessage sanitizes/formats it
      (messageEl.querySelector(".message-bubble") as HTMLElement).innerHTML =
        msg.text;
    });
  } else {
    // Add a default welcome message if no history exists
    addBotMessage(
      "Hello! I'm an AI assistant at G.e.m services automation. Ask me about my projects you see here or ask my contacts form or check about me.",
    );
  }
}

/**
 * Adds a message from the bot to the chat window and saves history.
 * @param {string} text - The bot's message text.
 */
function addBotMessage(text: string) {
  const messageEl = addMessage(text, "bot");
  saveChatHistory();
  return messageEl;
}

/**
 * Adds a message from the user to the chat window and saves history.
 * @param {string} text - The user's message text.
 */
function addUserMessage(text: string) {
  addMessage(text, "user");
  saveChatHistory();
}

/**
 * Creates and displays the contact form within the chat window.
 */
function displayContactForm() {
  // ... (displayContactForm function remains the same, but we'll call saveChatHistory)
  const formContainer = document.createElement("div");
  formContainer.className = "contact-form-container";
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

  const formMessageEl = addMessage(formContainer.outerHTML, "bot"); // Pass outerHTML to addMessage
  saveChatHistory(); // Save after adding the form

  const form = formMessageEl.querySelector(
    "#chatbot-contact-form",
  ) as HTMLFormElement;
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector(
        ".contact-submit-btn",
      ) as HTMLButtonElement;
      if (!submitBtn) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      const formData = new FormData(form);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const message = formData.get("message") as string;

      // We can remove the form from the DOM, but it's already in history.
      // Let's replace it with a "sending" message.
      formMessageEl.innerHTML =
        '<div class="message-bubble">Sending your message...</div>';

      // Send email via worker
      const result = await sendContactFormToWorker(name, email, message);

      // Remove the "sending" message
      formMessageEl.remove();

      if (result.status === "sent") {
        addBotMessage(
          `Thanks, ${name}! Your message has been sent. I'll be in touch soon.`,
        );
      } else {
        addBotMessage(
          `Sorry, there was an error: ${result.info || "Unknown error"}. Please try again.`,
        );
      }
    });
  }
}

/**
 * Handles the chat form submission.
 * @param {Event} e - The form submission event.
 */
async function handleChatSubmit(e: Event) {
  e.preventDefault();
  if (!chatInput || chatInput.value.trim() === "") return;

  const userMessage = chatInput.value.trim();
  addUserMessage(userMessage);
  chatInput.value = "";
  sendBtn.disabled = true;
  micBtn.disabled = true;

  // Contact form orchestration logic
  const contactKeywords = [
    "contact",
    "contact form",
    "send email",
    "message me",
    "get in touch",
  ];
  if (
    contactKeywords.some((keyword) =>
      userMessage.toLowerCase().includes(keyword),
    )
  ) {
    console.log("Contact form keywords detected. Displaying contact form."); // Debugging line
    displayContactForm();
    sendBtn.disabled = false;
    micBtn.disabled = false;
    return;
  }

  // Fallback to conversational chat
  const loadingMessage = addMessage("", "loading");
  try {
    const botResponseText = await sendPrompt(userMessage);
    // The response might contain an error message, but we display it the same way
    addBotMessage(botResponseText);
  } catch (error) {
    // This catch block might be redundant if sendPrompt always returns a string,
    // but it's good for catching unexpected failures.
    console.error("Chatbot submission error:", error);
    addBotMessage(
      "Oops! I'm having trouble connecting. Please try again in a moment.",
    );
  } finally {
    loadingMessage.remove();
    sendBtn.disabled = false;
    micBtn.disabled = false;
  }
}

// --- Theme Toggling ---
/**
 * Sets the color theme for the application.
 * @param {'light' | 'dark'} theme - The theme to set.
 */
function setTheme(theme: "light" | "dark") {
  // ... (setTheme function remains the same)
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML =
      theme === "dark"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    themeToggleBtn.setAttribute(
      "aria-label",
      `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
    );
  }
}

/**
 * Handles the click event for the theme toggle button.
 */
function handleThemeToggle() {
  // ... (handleThemeToggle function remains the same)
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme as "light" | "dark");
}

// --- Event Listeners ---

// Toggles the chat window's visibility when the FAB is clicked.
fab?.addEventListener("click", () => {
  // ... (event listener remains the same)
  const isVisible = chatWindow?.classList.toggle("visible");
  (chatWindow as HTMLElement).inert = !isVisible;
  fab.setAttribute("aria-label", isVisible ? "Close chat" : "Open chat");
  if (isVisible) {
    chatInput?.focus();
  }
});

// Hides the chat window when the close button is clicked.
closeBtn?.addEventListener("click", () => {
  // ... (event listener remains the same)
  chatWindow?.classList.remove("visible");
  (chatWindow as HTMLElement).inert = true;
  fab?.setAttribute("aria-label", "Open chat");
});

// Handles sending the message when the form is submitted.
chatForm?.addEventListener("submit", handleChatSubmit);

// Enables or disables the send button based on whether the input has text.
chatInput?.addEventListener("input", () => {
  // ... (event listener remains the same)
  if (sendBtn && chatInput) {
    sendBtn.disabled = chatInput.value.trim() === "";
  }
});

// Starts or stops voice recognition when the mic button is clicked.
micBtn?.addEventListener("click", () => {
  // ... (event listener remains the same)
  console.log("Voice recognition not implemented yet.");
});

// Add event listener for theme toggle
themeToggleBtn?.addEventListener("click", handleThemeToggle);

// --- Initialization ---

// When the DOM is fully loaded, render projects and load chat history.
document.addEventListener("DOMContentLoaded", async () => {
  await renderProjects();
  loadChatHistory();
  // Set initial theme based on saved preference or system setting
  const savedTheme = sessionStorage.getItem("theme") as "light" | "dark" | null;
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    setTheme(prefersDark ? "dark" : "light");
  }
});
