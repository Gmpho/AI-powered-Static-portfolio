import { GoogleGenAI, Type, Content } from "@google/genai";

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

interface Project {
  title: string;
  description: string;
  tags: string[];
  url: string;
}

/**
 * The hardcoded data source for projects. In a real-world scenario, this would
 * live in a database or a CMS and be fetched by the MCP server tool.
 * @type {Array<Project>}
 */
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
 * The schema for the data returned by the projectMetadata tool.
 */
interface ProjectMetadata {
    name: string;
    description: string;
    url: string;
    tags: string[];
}


/**
 * The system instruction context provided to the Gemini API for general chat.
 * This string defines the AI's persona, rules, and the data it has access to.
 * @type {string}
 */
const projectsContext = `
A delightful and insightful AI guide for Gift Mpho's personal portfolio website. 
Your persona is that of a tech-savvy, enthusiastic, and slightly playful assistant.
Your primary mission is to showcase Gift's projects in the best possible light and engage visitors in a memorable way.
This portfolio has a semantic search function that you are not responsible for. If the user asks you to find or search for a project, the system will handle it.
You are responsible for general conversation.

**Your Core Directives:**
- **Be Enthusiastic & Descriptive:** Don't just list facts. Use vivid language. For example, instead of "It uses React," say "It's built on the powerful React library, allowing for a lightning-fast and dynamic user experience."
- **Ask Clarifying Questions:** If a user's query is vague (e.g., "tell me about your work"), prompt them for more details. For instance: "I can definitely do that! Are you more interested in the cutting-edge AI projects, or the full-stack web applications?"
- **Maintain a Witty but Professional Tone:** Keep it professional, but inject personality.
    - *Example 1 (Tech Stack):* If asked about my tech stack, you could say: "Ah, the secret sauce! I'm powered by the magical Gemini API and a whole lot of TypeScript. It's like having a wizard in the machine. 😉 What part of the magic are you most curious about?"
- **Be Proactive & Suggest Questions:** Don't just wait for the next prompt. After answering a question, suggest a related, engaging follow-up question to guide the conversation.
- **Keep Answers Concise but Informative:** Use simple markdown (like bolding and bullet points) to make your answers easy to scan and digest.
- **Always be helpful and positive.**

Here is the project data you have access to for conversational purposes:
${projects
  .map(
    (p) =>
      `- **${p.title}**: ${p.description} (Key Technologies: ${p.tags.join(
        ", ",
      )}) [URL: ${p.url}]`,
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
let conversationHistory: Content[] = [];
let projectEmbeddings: Map<ProjectMetadata, number[]> = new Map();
let lastSpeechConfidence: number | null = null;


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
    // The SpeechRecognition API can provide multiple results.
    // We will concatenate them.
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
        // If this is the final result, capture its confidence.
        if (event.results[i].isFinal) {
            lastSpeechConfidence = event.results[i][0].confidence;
        }
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

// --- AI and Search Simulation ---

/**
 * Simulates the 'projectMetadata' MCP tool. This function is the single source
 * of truth for project data in the application.
 * @returns {Promise<{ projects: ProjectMetadata[] }>} A list of projects conforming to the tool's output schema.
 */
async function projectMetadataTool(): Promise<{ projects: ProjectMetadata[] }> {
    // In a real app, this would be a fetch call to the MCP server.
    // For this simulation, we resolve with the hardcoded data, mapping field names.
    return Promise.resolve({
        projects: projects.map(p => ({
            name: p.title,
            description: p.description,
            url: p.url,
            tags: p.tags,
        }))
    });
}

/**
 * The response schema for the contactEmail tool.
 */
interface ContactEmailResponse {
  status: 'sent' | 'failed';
  info?: string;
}

/**
 * Simulates the 'contactEmail' MCP tool.
 * @param {string} name The user's name.
 * @param {string} email The user's email.
 * @param {string} message The user's message.
 * @returns {Promise<ContactEmailResponse>} The status of the email sending operation.
 */
async function contactEmailTool(name: string, email: string, message: string): Promise<ContactEmailResponse> {
    console.log(`Simulating sending email:`, { name, email, message });
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!name || !email || !message || !email.includes('@')) {
        return { status: 'failed', info: 'Please fill out all fields correctly.' };
    }

    // Simulate random success for demonstration
    if (Math.random() > 0.1) { // 90% success rate
        return { status: 'sent' };
    } else {
        return { status: 'failed', info: 'An unknown server error occurred.' };
    }
}


/**
 * Generates a vector embedding for a given text using the Gemini API.
 * This function includes robust parsing to handle variations in the API response.
 * @param {string} text The text to embed.
 * @returns {Promise<number[]>} A promise that resolves to a vector (array of numbers).
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!ai) throw new Error("AI not initialized");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a 768-dimension vector embedding for the following text. Respond ONLY with a JSON array of numbers. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.NUMBER,
            }
        }
      }
    });
    
    const responseText = response.text;
    // Find the start of the JSON array.
    const startIndex = responseText.indexOf('[');
    if (startIndex === -1) {
      throw new Error(`Could not find the start of a JSON array in the response. Text: "${responseText}"`);
    }

    // Find the matching closing bracket to avoid including trailing text.
    let openBrackets = 0;
    let endIndex = -1;
    // Start searching from the beginning of the potential array.
    for (let i = startIndex; i < responseText.length; i++) {
      if (responseText[i] === '[') {
        openBrackets++;
      } else if (responseText[i] === ']') {
        openBrackets--;
      }
      // When openBrackets becomes 0, we've found the matching closing bracket.
      if (openBrackets === 0) {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      // This happens if the response is truncated and the array is not closed.
      throw new Error(`Could not find the end of the JSON array in the response (it may be truncated). Text: "${responseText}"`);
    }

    // Extract the JSON string from start to the matched end.
    const jsonStr = responseText.substring(startIndex, endIndex + 1);
    const vector = JSON.parse(jsonStr);

    if (Array.isArray(vector) && vector.every(n => typeof n === 'number')) {
        return vector;
    } else {
        throw new Error("Parsed JSON is not a valid number array.");
    }
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    // Return a zero vector as a fallback for any failure.
    return Array(768).fill(0);
  }
}

/**
 * Calculates the cosine similarity between two vectors.
 * @param {number[]} vecA First vector.
 * @param {number[]} vecB Second vector.
 * @returns {number} The cosine similarity score.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * Indexes all projects by fetching them from the tool and storing their embeddings.
 * This pre-computation optimizes search performance.
 */
async function indexProjects() {
  console.log("Indexing projects...");
  const { projects: projectsFromTool } = await projectMetadataTool();
  for (const project of projectsFromTool) {
    const projectText = `${project.name}. ${project.description}. Tags: ${project.tags.join(", ")}`;
    const embedding = await generateEmbedding(projectText);
    projectEmbeddings.set(project, embedding);
  }
  console.log("Project indexing complete.");
}

/**
 * Calculates a hybrid search score combining semantic similarity and keyword matching.
 * @param {string} query The user's query text.
 * @param {ProjectMetadata} project The project to score.
 * @param {number[]} queryVector The vector for the user's query.
 * @param {number[]} projectVector The vector for the project.
 * @param {number | null} confidence The speech recognition confidence score.
 * @returns {number} The combined hybrid score.
 */
function calculateHybridScore(
    query: string,
    project: ProjectMetadata,
    queryVector: number[],
    projectVector: number[],
    confidence: number | null
): number {
    // 1. Calculate semantic score (cosine similarity)
    const semanticScore = cosineSimilarity(queryVector, projectVector);

    // 2. Calculate keyword score based on tag matching
    let keywordScore = 0;
    const lowerCaseQuery = query.toLowerCase();
    for (const tag of project.tags) {
        if (lowerCaseQuery.includes(tag.toLowerCase())) {
            keywordScore += 1;
        }
    }
    // Normalize keyword score
    const normalizedKeywordScore = project.tags.length > 0 ? keywordScore / project.tags.length : 0;

    // 3. Determine weights based on confidence
    // High confidence or typed input: prioritize semantic search.
    // Low confidence: give more weight to keywords as semantics may be inaccurate.
    const semanticWeight = (confidence === null || confidence > 0.7) ? 0.7 : 0.4;
    const keywordWeight = 1 - semanticWeight;

    // 4. Calculate final hybrid score
    const hybridScore = (semanticWeight * semanticScore) + (keywordWeight * normalizedKeywordScore);
    
    return hybridScore;
}


/**
 * Searches for the best project match using a hybrid scoring model.
 * @param {string} query The user's search query text.
 * @param {number[]} queryVector The vector of the user's search query.
 * @param {number | null} confidence The speech recognition confidence score.
 * @returns {Promise<ProjectMetadata | null>} The project with the highest similarity score.
 */
async function findBestProjectMatch(
    query: string,
    queryVector: number[],
    confidence: number | null
): Promise<ProjectMetadata | null> {
    let bestMatch: ProjectMetadata | null = null;
    let highestScore = -1;

    for (const [project, projectVector] of projectEmbeddings.entries()) {
        const score = calculateHybridScore(query, project, queryVector, projectVector, confidence);
        if (score > highestScore) {
            highestScore = score;
            bestMatch = project;
        }
    }
    return bestMatch;
}

/**
 * Initializes the GoogleGenAI client, creates a chat session, and indexes projects.
 */
async function initializeAI() {
  const loadingMessage = addMessage("Initializing AI and preparing project search...", "loading");
  try {
    // Fix: Updated API key initialization to use `process.env.API_KEY` as required by the coding guidelines.
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    await indexProjects();
    loadingMessage.remove();
    addBotMessage("Hello! I'm G.E.M., your AI guide. Ask me a question, or try searching for a project (e.g., 'Find a project about UI/UX'). You can also ask me to 'send a message' to get in touch!");
  } catch (error) {
    console.error("Failed to initialize AI:", error);
    loadingMessage.remove();
    addBotMessage("Sorry, the AI assistant is currently unavailable.");
    if(chatInput) chatInput.disabled = true;
    if(sendBtn) sendBtn.disabled = true;
  }
}

/**
 * Renders project cards into the projects container by fetching data from the tool.
 */
async function renderProjects() {
  if (!projectsContainer) return;
  const { projects: projectsFromTool } = await projectMetadataTool();
  projectsContainer.innerHTML = projectsFromTool
    .map(
      (project) => `
    <a href="${project.url}" target="_blank" rel="noopener noreferrer" class="project-card-link">
        <div class="project-card">
        <h3>${project.name}</h3>
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
 * @param {string | HTMLElement} content - The message text or an HTML element to display.
 * @param {'user' | 'bot' | 'loading'} sender - The sender of the message.
 * @returns {HTMLElement} The created message element.
 */
function addMessage(content: string | HTMLElement, sender: 'user' | 'bot' | 'loading'): HTMLElement {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");

  if (sender === 'loading') {
    bubble.innerHTML = (typeof content === 'string' && content) ? content : '<div class="dot-flashing"></div>';
  } else if (typeof content === 'string') {
    let text = content;
    // Basic markdown for bolding (**text**)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Basic markdown for bullet points (* text)
    text = text.replace(/^\s*\*\s/gm, '<br>• ');
     // Basic markdown for links ([text](url))
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    bubble.innerHTML = text;
  } else {
    // It's an HTMLElement
    bubble.appendChild(content);
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

    const formMessageEl = addMessage(formContainer, 'bot');

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
            const loadingEl = addMessage("Sending your message...", "loading");

            const result = await contactEmailTool(name, email, message);
            
            loadingEl.remove();

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
  const confidenceForThisQuery = lastSpeechConfidence; // Capture confidence for this message
  lastSpeechConfidence = null; // Reset for the next input

  addUserMessage(userMessage);
  chatInput.value = "";
  if(sendBtn) sendBtn.disabled = true;

  // Contact form orchestration logic
  const contactKeywords = ['contact', 'email', 'message', 'send a message'];
  if (contactKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
    displayContactForm();
    return;
  }

  // Search orchestration logic
  const searchKeywords = ['find', 'search', 'look for', 'looking for'];
  if (searchKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
    const loadingEl = addMessage("Searching for relevant projects...", "loading");
    try {
      const queryVector = await generateEmbedding(userMessage);
      const foundProject = await findBestProjectMatch(userMessage, queryVector, confidenceForThisQuery);
      loadingEl.remove();

      if (foundProject) {
        const resultText = `I found a project that seems like a great match!

**${foundProject.name}**
${foundProject.description}

*Key Technologies: ${foundProject.tags.join(", ")}*

You can [view the project here](${foundProject.url}).`;
        addBotMessage(resultText);
      } else {
        addBotMessage("I couldn't find a project that perfectly matched your description. Could you try rephrasing your search?");
      }
    } catch (error) {
      console.error("Search failed:", error);
      loadingEl.remove();
      addBotMessage("Sorry, I encountered an error while searching. Please try again.");
    }
    return;
  }

  // Fallback to conversational chat
  if (!ai) return;

  conversationHistory.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const loadingEl = addMessage("", "loading");
  try {
    // Limit history to the last 5 turns (10 messages) to manage context window
    const HISTORY_LIMIT = 10;
    if (conversationHistory.length > HISTORY_LIMIT) {
      conversationHistory = conversationHistory.slice(
        conversationHistory.length - HISTORY_LIMIT,
      );
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conversationHistory,
        config: {
          systemInstruction: projectsContext,
        },
    });

    const botResponseText = response.text;
    
    // Add the model's response to the history for future context
    conversationHistory.push({
      role: 'model',
      parts: [{ text: botResponseText }],
    });

    loadingEl.remove();
    addBotMessage(botResponseText);
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
    // Reset speech confidence if user types manually
    lastSpeechConfidence = null;
});

// Starts or stops voice recognition when the mic button is clicked.
micBtn?.addEventListener('click', toggleSpeechRecognition);

// Add event listener for theme toggle
themeToggleBtn?.addEventListener('click', handleThemeToggle);

// --- Initialization ---

// When the DOM is fully loaded, render the project cards and initialize the AI.
document.addEventListener("DOMContentLoaded", async () => {
  await renderProjects();
  await initializeAI();
  
  // Set initial theme icon
  const initialTheme = document.documentElement.getAttribute('data-theme');
  if (initialTheme === 'light' || initialTheme === 'dark') {
      setTheme(initialTheme as 'light' | 'dark');
  }
});