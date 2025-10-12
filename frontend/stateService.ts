
interface ThoughtSignature {
  // Define properties based on what the worker sends
  // For now, let's assume it's a string or an object with a text property
  text?: string;
  // Add other properties if needed
}

// 1. Define the shape of our application's state
export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  html?: boolean; // Flag to indicate if the text is pre-formatted HTML
  isStreaming?: boolean; // New: Flag to indicate if the message is currently being streamed
  lastThoughtSignature?: ThoughtSignature; // New property
}

interface AppState {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  isThinking: boolean;
  isThinkingModeEnabled: boolean; // New property
  lastThoughtSignature?: ThoughtSignature; // New property
}

// 2. Define the type for our listener functions
type StateListener = (state: AppState) => void;

// 3. Create the StateService class (as a Singleton)
class StateService {
  private static instance: StateService;
  private state: AppState = {
    chatHistory: [],
    isLoading: false,
    isThinking: false,
    isThinkingModeEnabled: false, // Initialize new property
  };
  private listeners: StateListener[] = [];

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): StateService {
    if (!StateService.instance) {
      StateService.instance = new StateService();
    }
    return StateService.instance;
  }

  // Method for components to get the current state
  public getState(): AppState {
    return { ...this.state };
  }

  // Method for components to subscribe to state changes
  public subscribe(listener: StateListener) {
    this.listeners.push(listener);
  }

  // Method to notify all listeners of a state change
  private notify() {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  // --- State Mutation Methods ---
  // These methods are the ONLY way to change the application state.

  public setLoading(isLoading: boolean) {
    this.state.isLoading = isLoading;
    this.notify();
  }

  public setThinking(isThinking: boolean) {
    this.state.isThinking = isThinking;
    this.notify();
  }

  public setThinkingModeEnabled(isEnabled: boolean) {
    this.state.isThinkingModeEnabled = isEnabled;
    this.notify();
  }

  public addMessage(message: Omit<ChatMessage, 'id'>) {
    const lastMessage = this.state.chatHistory[this.state.chatHistory.length - 1];

    // If the last message is a streaming bot message, append to it
    if (message.sender === "bot" && message.isStreaming && lastMessage && lastMessage.sender === "bot" && lastMessage.isStreaming) {
      lastMessage.text += message.text;
      // Update the ID to ensure React/frontend re-renders if using keys
      lastMessage.id = `msg-${Date.now()}-${Math.random()}`;
    } else {
      // Otherwise, add a new message
      const newMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random()}`,
      };
      this.state.chatHistory.push(newMessage);
    }
    this.notify();
  }

  public updateLastMessage(updates: Partial<ChatMessage>) {
    const lastMessage = this.state.chatHistory[this.state.chatHistory.length - 1];
    if (lastMessage) {
      Object.assign(lastMessage, updates);
      lastMessage.id = `msg-${Date.now()}-${Math.random()}`;
      this.notify();
    }
  }

  public clearChatHistory() {
    this.state.chatHistory = [];
    this.notify();
  }

  public loadChatHistory(history: ChatMessage[]) {
    this.state.chatHistory = history;
    this.notify();
  }
}

// Export a single instance of the service
export const stateService = StateService.getInstance();
