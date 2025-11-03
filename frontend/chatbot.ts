import { projects } from "./projects";
import { stateService } from "./stateService";
import env from "./src/env"; // Import env for VITE_WORKER_URL
import { setAriaLiveRegion } from "./src/accessibility"; // Import accessibility helpers

interface WorkerJsonResponse {
  response?: string;
}


export async function sendPrompt(
  prompt: string,
  persona: string | undefined,
  onChunk: (chunk: any) => void, // Accept string or parsed object
  onComplete: () => void, // Callback when stream ends
  onError: (error: string) => void, // Callback for errors
  onLoading: (isLoading: boolean) => void, // Callback for loading state
  toolResponse?: any, // Optional tool response to send
  _depth = 0, // internal recursion depth to prevent loops
): Promise<void> {
  const MAX_DEPTH = 2;
  if (_depth > MAX_DEPTH) {
    onError('Maximum tool-response recursion exceeded.');
    return;
  }

  onLoading(true); // Set loading state to true at the start

  const workerUrl = env.VITE_WORKER_URL?.replace(/\/$/, '');

  if (!workerUrl) {
    const errorMessage =
      "Configuration error: VITE_WORKER_URL is not set. Please check your frontend/.env.local file.";
    console.error(errorMessage);
    onError(errorMessage);
    onLoading(false); // Reset loading state on error
    return;
  }

  try {
    const rawHistory = stateService.getState().chatHistory;
    const history = rawHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      content: msg.text, // Changed to content to match worker schema
    }));

    // Add timeout / abort support to avoid hanging requests
    const controller = new AbortController();
    const timeoutMs = 60000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${workerUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, persona, projects, toolResponse, messages: history }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
        const errorText = await response.text();
        onError(`Request failed: ${response.status} - ${errorText}`);
        return;
    }

    if (!response.body || !contentType.includes('text/event-stream')) {
        onError('Expected a streaming response, but received a different content type.');
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last, possibly incomplete line

            for (const line of lines) {
                if (line.startsWith('event: error')) {
                    const dataLine = lines.find(l => l.startsWith('data: '));
                    if (dataLine) {
                        const errorData = JSON.parse(dataLine.substring(6));
                        onError(errorData.error || 'An unknown streaming error occurred.');
                    }
                    return; // Stop processing on error
                } else if (line.startsWith('event: completion')) {
                    onComplete();
                    return; // Stop processing on completion
                } else if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.substring(6));
                    if (data.response) {
                        onChunk(data.response);
                    }
                    // Handle tool calls from the worker
                    if (data.toolCall && data.toolCall.name === 'displayContactForm') {
                        // Dispatch a custom event that the main UI can listen for
                        document.dispatchEvent(new CustomEvent('display-contact-form'));
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error reading stream:", error);
        onError("An error occurred while reading the AI's response.");
    } finally {
        onComplete();
    }

  } catch (error) {
    console.log("GEMINI_DEBUG_CHATBOT: Caught error in sendPrompt:", error);
    console.error("Failed to send prompt to worker:", error);
    if (error instanceof Error) {
      onError(`Sorry, I encountered an error: ${error.message}`);
    } else {
      onError("An unknown error occurred while trying to communicate with the AI.");
    }
  } finally {
    onLoading(false); // Always reset loading state
  }
}
