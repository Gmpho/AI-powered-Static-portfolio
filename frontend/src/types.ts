export interface ChatMessage {
    id: string;
    text: string;
    sender: "user" | "bot" | "loading";
    html?: boolean;
    isStreaming?: boolean;
    type?: string;
  }
  