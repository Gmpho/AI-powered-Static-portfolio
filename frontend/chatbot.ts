import { projects } from "./projects";
import { stateService } from "./stateService";


export async function sendPrompt(
  prompt: string,
  persona: string | undefined,
  onChunk: (chunk: any) => void, // Accept string or parsed object
  onComplete: () => void, // Callback when stream ends
  onError: (error: string) => void, // Callback for errors
  toolResponse?: any, // Optional tool response to send
  _depth = 0, // internal recursion depth to prevent loops
): Promise<void> {
  const MAX_DEPTH = 2;
  if (_depth > MAX_DEPTH) {
    onError('Maximum tool-response recursion exceeded.');
    return;
  }

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

    // Add timeout / abort support to avoid hanging requests
    const controller = new AbortController();
    const timeoutMs = 60000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${workerUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, persona, projects, toolResponse, history }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // If server returned non-stream JSON (no body stream), handle it as a normal JSON response
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      const errorText = await response.text();
      onError(`Request failed: ${response.status} - ${errorText}`);
      return;
    }

    if (!response.body) {
      if (contentType.includes('application/json')) {
        try {
          const json = await response.json();
          onChunk(json);
          onComplete();
          return;
        } catch (e) {
          onError('Failed to parse JSON response from worker.');
          return;
        }
      } else {
        onError('No response body from worker.');
        return;
      }
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        console.log('Frontend received raw chunk:', chunkText); // Debug log

        const lines = chunkText.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          try {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              // Try parse JSON; if it's JSON, forward the object; otherwise forward raw string
              try {
                const parsedData = JSON.parse(data);
                // If tool triggered a function response, recurse but guard depth
                if (parsedData.functionResponse) {
                  await sendPrompt(prompt, persona, onChunk, onComplete, onError, parsedData.functionResponse, _depth + 1);
                  return; // exit current handler — the recursive call will continue stream
                }
                onChunk(parsedData);
              } catch {
                onChunk(data);
              }
            } else {
              onChunk(line);
            }
          } catch (innerErr) {
            console.warn('Error processing chunk line:', innerErr);
          }
        }
      }
    } finally {
      try { await reader.cancel(); } catch { /* ignore */ }
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
