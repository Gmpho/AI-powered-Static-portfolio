import { ChatMessage } from "./src/types";

// 1. Define the shape of our application's state
interface AppState {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null; // New: Add error state
}

// 2. Define the type for our listener functions
/**
 * Type definition for a listener function that reacts to changes in the AppState.
 */
type StateListener = (state: AppState) => void;

// 3. Create the StateService class (as a Singleton)
/**
 * Implements a centralized state management system for the frontend using the Singleton pattern.
 * Provides methods to update and subscribe to application state changes.
 */
class StateService {
  private static instance: StateService;
  private state: AppState = {
    chatHistory: [],
    isLoading: false,
    error: null, // New: Initialize error state
  };
  private listeners: StateListener[] = [];

  private constructor() {
    // Private constructor to enforce singleton pattern
    console.log('StateService initialized');
    this.loadChatHistoryFromSessionStorage(); // Load history on initialization
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
    console.log('New listener subscribed to state changes');
    this.listeners.push(listener);
  }

  // Method to notify all listeners of a state change
  private notify() {
    console.log(`Notifying ${this.listeners.length} listeners of state change`);
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  // --- State Mutation Methods ---
  // These methods are the ONLY way to change the application state.

  public setError(error: string | null) {
    this.state.error = error;
    this.notify();
  }

  public setLoading(isLoading: boolean) {
    this.state.isLoading = isLoading;
    this.notify();
  }

  public addMessage(message: Omit<ChatMessage, 'id'>) {
    console.log('Adding new message:', message.text);
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
    this.saveChatHistoryToSessionStorage();
  }

  public updateLastMessage(updates: Partial<ChatMessage>) {
    console.log('Updating last message with:', updates);
    const lastMessage = this.state.chatHistory[this.state.chatHistory.length - 1];
    if (lastMessage) {
      Object.assign(lastMessage, updates);
      lastMessage.id = `msg-${Date.now()}-${Math.random()}`;
      this.notify();
      this.saveChatHistoryToSessionStorage();
    }
  }

  public clearChatHistory() {
    this.state.chatHistory = [];
    this.notify();
    this.saveChatHistoryToSessionStorage();
  }

  // New method to directly set the chat history
  public setHistory(history: ChatMessage[]) {
    this.state.chatHistory = history;
    this.notify();
    this.saveChatHistoryToSessionStorage();
  }

  public loadChatHistoryFromSessionStorage() {
    try {
      const storedHistory = sessionStorage.getItem('chatHistory');
      if (storedHistory) {
        this.state.chatHistory = JSON.parse(storedHistory);
      } else {
        // If no history, initialize with a welcome message
        this.state.chatHistory = [
          {
            id: 'welcome-msg',
            text: 'Hello! I am AG Gift, your AI assistant. How can I help you today?',
            sender: 'bot',
            html: false,
          },
        ];
      }
    } catch (error) {
      console.error('Error loading chat history from sessionStorage:', error);
      // Fallback to default welcome message if loading fails
      this.state.chatHistory = [
        {
          id: 'welcome-msg',
          text: 'Hello! I am AG Gift, your AI assistant. How can I help you today?',
          sender: 'bot',
          html: false,
        },
      ];
    }
  }

  public saveChatHistoryToSessionStorage() {
    try {
      sessionStorage.setItem('chatHistory', JSON.stringify(this.state.chatHistory));
    } catch (error) {
      console.error('Error saving chat history to sessionStorage:', error);
    }
  }
}

// Export a single instance of the service
/**
 * The singleton instance of the StateService for managing application state.
 */
export const stateService = StateService.getInstance();
