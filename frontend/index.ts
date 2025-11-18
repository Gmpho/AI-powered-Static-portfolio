import { sendPrompt } from "./src/chatbot";
import DOMPurify from 'dompurify';
import { fetchResumeData, displayPdfEmbed } from "./src/resume"; // Import resume functions
import { getTranslation } from "./src/i18n"; // Import getTranslation
import { setAriaLiveRegion } from "./src/accessibility"; // Import setAriaLiveRegion
import { projects } from "./projects";
import { stateService } from "./stateService";
import { marked } from 'marked';
import hljs from 'highlight.js';

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
const themeToggleBtn = document.getElementById("theme-toggle");

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



/**
 * Renders the interactive contact form inside a message bubble and attaches its event listener.
 * @param {HTMLElement} bubble - The message bubble element to render the form into.
 */
interface ContactFormWorkerResponse {
  status: "sent" | "failed";
  info?: string;
}

async function sendContactFormToWorker(
  name: string,
  email: string,
  message: string,
): Promise<ContactFormWorkerResponse> {
  // Use relative path due to proxy
  try {
    const response = await fetch(`/contact`, {
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

function renderChatHistory() {
  if (!chatMessages) return;
  chatMessages.innerHTML = ''; // Clear existing messages
  stateService.getState().chatHistory.forEach(msg => {
    const messageEl = document.createElement("div");
    messageEl.classList.add("message", msg.sender);

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    if (msg.type === 'contactForm') {
      renderContactFormInBubble(bubble);
    } else if (msg.sender === "loading") {
      bubble.innerHTML = `<div class="dot-flashing" aria-label="${getTranslation('loading')}"></div>`;
    } else {
      const sanitizedHtml = DOMPurify.sanitize(marked.parse(msg.text) as string);
      bubble.innerHTML = sanitizedHtml;
    }
    messageEl.appendChild(bubble);
    chatMessages?.appendChild(messageEl);
  });
  if (chatMessages) {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }
}

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
        const errorMatch = error.match(/HTTP error! status: \d+ - (.*)/);
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
  console.log('DOMContentLoaded event fired');
  // Listen for the custom event dispatched by the chatbot stream
  document.addEventListener('display-contact-form', () => {
    stateService.addMessage({
      text: 'Please fill out the form below.', // This text is for state debugging
      sender: 'bot',
      type: 'contactForm',
    });
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
    console.log('State change detected, re-rendering chat history');
    renderChatHistory();
  });
  renderChatHistory(); // Initial render


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
