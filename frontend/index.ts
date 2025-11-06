import { sendPrompt } from "./chatbot";
import DOMPurify from 'dompurify';
import { fetchResumeData, displayPdfEmbed } from "./src/resume"; // Import resume functions
import { getTranslation } from "./src/i18n"; // Import getTranslation
import { setAriaLiveRegion } from "./src/accessibility"; // Import setAriaLiveRegion

interface ContactFormWorkerResponse {
  status: "sent" | "failed";
  info?: string;
}

async function sendContactFormToWorker(
  name: string,
  email: string,
  message: string,
): Promise<ContactFormWorkerResponse> {
  const workerUrl = import.meta.env.VITE_WORKER_URL?.replace(/\/$/, '');

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
const resumeContainer = document.getElementById("resume-container"); // New: Resume container
const fab = document.getElementById("chatbot-fab");
const chatWindow = document.getElementById("chatbot-window");
const closeBtn = document.getElementById("chatbot-close");
const chatMessages = document.getElementById("chatbot-messages");
const chatForm = document.getElementById("chatbot-form");
const chatInput = document.getElementById("chatbot-input") as HTMLInputElement;
const sendBtn = document.getElementById("chatbot-send") as HTMLButtonElement;
const micBtn = document.getElementById("chatbot-mic") as HTMLButtonElement;
const contactBtn = document.querySelector(".contact-btn");
console.log('Contact button found:', contactBtn);
const themeToggleBtn = document.getElementById("theme-toggle");

// --- Constants ---
const CHAT_HISTORY_KEY = "chatHistory";

// Event listener for the main contact button
contactBtn?.addEventListener('click', () => {
  console.log('Contact button clicked!');
  // Open the chatbot window if it's not already visible
  if (!chatWindow?.classList.contains('visible')) {
    chatWindow?.classList.add('visible');
    (chatWindow as HTMLElement).inert = false;
    fab?.setAttribute("aria-label", "Close chat");
    chatInput?.focus();
  }
  // Directly display the contact form
  displayContactForm();
});

import { projects } from "./projects";
import { stateService } from "./stateService"; // Import stateService

/**
 * Renders project cards into the projects container.
 */
async function renderProjects(limit?: number) {
  if (!projectsContainer) return;
  const projectsToRender = limit ? projects.slice(0, limit) : projects;
  let html = projectsToRender
    .map(
      (project) => `
    <a href="${project.url}" target="_blank" rel="noopener noreferrer" class="project-card-link">
        <div class="project-card">
        <h3>${getTranslation(project.titleKey)}</h3>
        <p>${getTranslation(project.descriptionKey)}</p>
        <div class="project-tags">
            ${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
        </div>
    </a>
  `,
    )
    .join("");

  if (limit && limit < projects.length) {
    html += `<button class="load-more-btn">${getTranslation('loadMore')}</button>`;
  }

  projectsContainer.innerHTML = html;

  if (limit && limit < projects.length) {
    const loadMoreBtn = projectsContainer.querySelector(".load-more-btn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        renderProjects();
      });
    }
  }
}
function renderMarkdownToHtml(markdownText: string): string {
  const lines = markdownText.split("\n");
  let html = '';
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    // Code Block detection
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html += '</code></pre>';
        inCodeBlock = false;
      } else {
        html += '<pre><code>';
        inCodeBlock = true;
      }
      return; // Skip processing this line further
    }

    if (inCodeBlock) {
      html += line + '\n';
      return; // Continue collecting lines for code block
    }

    // Blockquote detection
    if (line.startsWith(">")) {
      html += `<blockquote>${line.substring(1).trim()}</blockquote>`;
      return; // Skip further processing for this line
    }

    // Add line break if not the first line and not inside a code block
    if (index > 0 && !inCodeBlock) html += '<br>';

    // Basic markdown for bullet points (* text)
    const bulletMatch = line.match(/^\s*\*\s(.*)/);
    if (bulletMatch) {
      html += `<ul><li>${bulletMatch[1]}</li></ul>`;
      return; // Continue to next line
    }

    // Regex to split by markdown links and bold text
    const regex = /(\*\*.*?\*\*)|(\[.*?\]\(.*?\))/g;
    const parts = line.split(regex).filter((part) => part);

    let lineHtml = '';
    parts.forEach((part) => {
      // Bold text: **text**
      if (part.startsWith("**") && part.endsWith("**")) {
        lineHtml += `<strong>${part.slice(2, -2)}</strong>`;
      }
      // Link: [text](url)
      else if (part.startsWith("[") && part.includes("](")) {
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          lineHtml += `<a href="${linkMatch[2]}" target="_blank" rel="noopener noreferrer">${linkMatch[1]}</a>`;
        } else {
          lineHtml += part;
        }
      } else {
        lineHtml += part;
      }
    });
    html += lineHtml;
  });

  // Close any open code block
  if (inCodeBlock) {
    html += '</code></pre>';
  }

  return html;
}

/**
 * Renders the interactive contact form inside a message bubble and attaches its event listener.
 * @param {HTMLElement} bubble - The message bubble element to render the form into.
 */
function renderContactFormInBubble(bubble: HTMLElement) {
  bubble.innerHTML = `
    <div class="contact-form-container">
      <p>${getTranslation('contactFormIntro')}</p>
      <form id="chatbot-contact-form" aria-labelledby="contact-form-title">
        <h4 id="contact-form-title" class="sr-only">${getTranslation('contactFormTitle')}</h4>
        <div>
          <label for="contact-name">${getTranslation('contactNameLabel')}</label>
          <input type="text" id="contact-name" name="name" required autocomplete="name" />
        </div>
        <div>
          <label for="contact-email">${getTranslation('contactEmailLabel')}</label>
          <input type="email" id="contact-email" name="email" required autocomplete="email" />
        </div>
        <div>
          <label for="contact-message">${getTranslation('contactMessageLabel')}</label>
          <textarea id="contact-message" name="message" rows="4" required></textarea>
        </div>
        <button type="submit" class="contact-submit-btn">${getTranslation('contactSendButton')}</button>
      </form>
    </div>
  `;

  const form = bubble.querySelector("#chatbot-contact-form") as HTMLFormElement;
  const formContainer = bubble.querySelector(".contact-form-container");

  if (form && formContainer) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector(".contact-submit-btn") as HTMLButtonElement;
      if (!submitBtn) return;

      submitBtn.disabled = true;
      submitBtn.textContent = getTranslation('contactSending');

      const formData = new FormData(form);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const message = formData.get("message") as string;

      // Replace form with a "sending" message
      formContainer.innerHTML = `<p>${getTranslation('contactSending')}</p>`;

      const result = await sendContactFormToWorker(name, email, message);

      // After submission, find the message this form belonged to and remove it from history
      const history = stateService.getState().chatHistory;
      const formMessageIndex = history.findIndex(msg => msg.type === 'contactForm');
      if (formMessageIndex > -1) {
        // Remove the form message and add the result message
        history.splice(formMessageIndex, 1);
        if (result.status === "sent") {
          stateService.setHistory([...history, { id: `msg-${Date.now()}-${Math.random()}`, text: getTranslation('contactSuccess', name), sender: "bot" }]);
        } else {
          stateService.setHistory([...history, { id: `msg-${Date.now()}-${Math.random()}`, text: getTranslation('contactError', result.info || "Unknown error"), sender: "bot" }]);
        }
      }
    });
  }
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
  isHtml: boolean = false,
  type?: string, // Add type parameter
): HTMLElement {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");

  if (type === 'contactForm') {
    renderContactFormInBubble(bubble);
  } else if (sender === "loading") {
    bubble.innerHTML = `<div class="dot-flashing" aria-label="${getTranslation('loading')}"></div>`; // Use getTranslation for aria-label
  } else if (sender === "bot" && text === "") {
    // For streaming bot messages, initially create an empty bubble
    // Content will be appended by appendMessageChunk
  }
      else {
        // Sanitize the text before rendering to prevent XSS
        const sanitizedText = DOMPurify.sanitize(text);
        if (isHtml) {
          bubble.innerHTML = sanitizedText; // Render trusted HTML directly
        } else {
          bubble.innerHTML = renderMarkdownToHtml(sanitizedText); // Render markdown to HTML
        }
  }
  messageEl.appendChild(bubble);
  chatMessages?.appendChild(messageEl);
  if (chatMessages) {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }
  return messageEl;
}

/**
 * Renders the entire chat history from the state service.
 */
function renderChatHistory() {
  if (!chatMessages) return;
  chatMessages.innerHTML = ''; // Clear existing messages
  stateService.getState().chatHistory.forEach(msg => {
    addMessage(msg.text, msg.sender, msg.html || false, msg.type);
  });
}

/**
 * Appends a text chunk to the last bot message in the chat window.
 * This is used for streaming responses.
 * @param {HTMLElement} messageEl - The message element to append to.
 * @param {string} chunk - The text chunk to append.
 */
function appendMessageChunk(messageEl: HTMLElement, chunk: string) {
  const bubble = messageEl.querySelector(".message-bubble");
  if (bubble) {
    const currentText = bubble.textContent || '';
    const newText = currentText + chunk;
    bubble.innerHTML = renderMarkdownToHtml(DOMPurify.sanitize(newText));

    // Scroll to bottom
    if (chatMessages) {
      requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }
  }
}



/**
 * Creates and displays the contact form within the chat window.
 */
function displayContactForm() {
  // Add a special message to the state that represents the form.
  // The rendering logic will handle creating the actual form.
  stateService.addMessage({
    text: 'Please fill out the form below.', // This text is for state debugging
    sender: 'bot',
    type: 'contactForm',
  });
}

/**
 * Displays a dismissible error banner at the top of the page.
 * @param {string} message - The error message to display.
 */
function displayError(message: string) {
  // Remove any existing error banner first
  const existingBanner = document.querySelector('.error-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  const errorBanner = document.createElement('div');
  errorBanner.className = 'error-banner';
  errorBanner.setAttribute('role', 'alert');
  errorBanner.innerHTML = `
    <span>${message}</span>
    <button class="error-banner-close" aria-label="${getTranslation('closeError')}">&times;</button>
  `;

  document.body.appendChild(errorBanner);

  const closeButton = errorBanner.querySelector('.error-banner-close');
  closeButton?.addEventListener('click', () => {
    errorBanner.remove();
  });

  // Automatically remove the banner after 10 seconds
  setTimeout(() => {
    errorBanner.remove();
  }, 10000);
}

/**
 * Handles the chat form submission.
 * @param {Event} e - The form submission event.
 */
async function handleChatSubmit(e: Event) {
  e.preventDefault();
  if (!chatInput || chatInput.value.trim() === "") return;

  const userMessage = chatInput.value.trim();
  stateService.addMessage({ text: userMessage, sender: "user" });
  chatInput.value = "";

  // Add an empty, streaming message for the bot's response immediately
  stateService.addMessage({ text: "", sender: "bot", isStreaming: true });

  await sendPrompt(
    userMessage,
    undefined,
    (chunk) => {
      // Append the chunk to the last message in the state
      const lastMessage = stateService.getState().chatHistory.slice(-1)[0];
      if (lastMessage && lastMessage.sender === 'bot') {
        stateService.updateLastMessage({ text: lastMessage.text + chunk });
      }
    },
    () => {
      // Mark the streaming as complete
      stateService.updateLastMessage({ isStreaming: false });
    },
    (error) => {
      console.log("GEMINI_DEBUG: Chatbot error:", error);
      // On error, remove the empty bot message and add the error as a bot message
      const lastMessage = stateService.getState().chatHistory.slice(-1)[0];
      if (lastMessage && lastMessage.sender === 'bot' && lastMessage.text === '') {
        stateService.getState().chatHistory.pop(); // Remove the empty streaming message
      }

      let errorMessage = getTranslation('chatbotErrorConnecting', error);
      // Attempt to parse the error string if it's a JSON response from the worker
      try {
        const errorMatch = error.match(/Request failed: \d+ - (.*)/);
        if (errorMatch && errorMatch[1]) {
          const errorObj = JSON.parse(errorMatch[1]);
          if (errorObj.error) {
            errorMessage = errorObj.error;
          }
        }
      } catch (e) {
        console.warn("Could not parse error message as JSON:", error);
      }
      stateService.addMessage({ text: errorMessage, sender: "bot" });
    },
    (isLoading: boolean) => {
      sendBtn.disabled = isLoading;
      micBtn.disabled = isLoading;
      chatInput.disabled = isLoading;
      chatForm?.classList.toggle('loading', isLoading);
    }
  );
}

// --- Theme Toggling ---
/**
 * Sets the color theme for the application.
 * @param {'light' | 'dark'} theme - The theme to set.
 */
function setTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML =
      theme === "dark"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    themeToggleBtn.innerHTML =
      theme === "dark"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    themeToggleBtn.setAttribute(
      "aria-label",
      theme === "dark" ? getTranslation('themeToggleLight') : getTranslation('themeToggleDark'),
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

/**
 * Renders the resume section by fetching data and embedding the PDF.
 */
async function renderResume() {
  if (!resumeContainer) return;

  const { fetchResumeData, displayPdfEmbed } = await import("./src/resume");

  const resumeData = await fetchResumeData();
  if (resumeData) {
    // You can display summary data here if needed
    // For now, we'll just embed the PDF
    displayPdfEmbed(resumeData.downloadUrl, "resume-container");
  } else {
    resumeContainer.innerHTML = `<p>${getTranslation('failedToLoadResume')}</p>`;
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Initialization ---

// When the DOM is fully loaded, render projects and load chat history.
document.addEventListener("DOMContentLoaded", async () => {
  // Listen for the custom event dispatched by the chatbot stream
  document.addEventListener('display-contact-form', () => {
    displayContactForm();
  });

  await renderProjects(3);
  await sleep(0);
  // await renderResume(); // Call renderResume

  // Set ARIA live region for chat messages
  if (chatMessages) {
    setAriaLiveRegion(chatMessages, 'polite');
  }

  // Subscribe to state changes and perform an initial render
  stateService.subscribe(() => {
    renderChatHistory();
  });
  setTimeout(() => {
    renderChatHistory(); // Initial render
  }, 0);

  // Set initial theme based on saved preference or system setting
  const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    setTheme(prefersDark ? "dark" : "light");
  }
});
