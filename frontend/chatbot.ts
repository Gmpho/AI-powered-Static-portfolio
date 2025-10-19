import { projects } from "./projects";
import { stateService } from "./stateService";


export async function sendPrompt(
  prompt: string,
  persona: string | undefined,
  onChunk: (chunk: string) => void, // Callback for each text chunk
  onComplete: () => void, // Callback when stream ends
  onError: (error: string) => void, // Callback for errors
  toolResponse?: any, // Optional tool response to send
): Promise<void> {
  const workerUrl = import.meta.env.VITE_WORKER_URL?.replace(/\/$/, '');

  if (!workerUrl) {
    const errorMessage =
      "Configuration error: VITE_WORKER_URL is not set. Please check your frontend/.env.local file.";
    console.error(errorMessage);
    onError(errorMessage);
    return;
  }

  try {
    const rawHistory = stateService.getState().chatHistory;
    const history = rawHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const response = await fetch(`${workerUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, persona, projects, toolResponse, history }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      onError(`Request failed: ${response.status} - ${errorText}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      console.log('Frontend received raw chunk:', chunkText); // Debug log

      const lines = chunkText.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.functionResponse) {
              // Recursively call sendPrompt with the tool response
              await sendPrompt(prompt, persona, onChunk, onComplete, onError, parsedData.functionResponse);
              return; // Exit the current loop
            } else {
              onChunk(parsedData);
            }
          } catch (e) {
            onChunk(data);
          }
        } else {
          onChunk(line);
        }
      }
    }

    onComplete();

  } catch (error) {
    console.error("Failed to send prompt to worker:", error);
    if (error instanceof Error) {
      onError(`Sorry, I encountered an error: ${error.message}`);
    } else {
      onError("An unknown error occurred while trying to communicate with the AI.");
    }
  }
}
