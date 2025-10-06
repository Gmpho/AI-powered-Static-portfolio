import { projects } from "./projects";

interface Project {
  title: string;
  summary: string;
  description: string;
  tags: string[];
  url: string;
}

interface WorkerError {
  error: string;
}

interface WorkerSuccess {
  response: string;
}

type WorkerResponse = WorkerSuccess | WorkerError;

export async function sendPrompt(
  prompt: string,
  persona?: string,
): Promise<string> {
  const workerUrl = import.meta.env.VITE_WORKER_URL;

  if (!workerUrl) {
    const errorMessage =
      "Configuration error: VITE_WORKER_URL is not set. Please check your frontend/.env.local file.";
    console.error(errorMessage);
    return errorMessage;
  }

  try {
    const response = await fetch(`${workerUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, persona, projects }),
    });

    const data: WorkerResponse = await response.json();

    if (!response.ok) {
      const errorMsg =
        (data as WorkerError).error ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    if ("response" in data) {
      return data.response;
    }

    throw new Error("Invalid response structure from worker.");
  } catch (error) {
    console.error("Failed to send prompt to worker:", error);
    if (error instanceof Error) {
      // Return the error message to be displayed in the chat.
      return `Sorry, I encountered an error: ${error.message}`;
    }
    return "An unknown error occurred while trying to communicate with the AI.";
  }
}
