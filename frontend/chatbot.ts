interface WorkerResponse {
  response?: string;
  error?: string;
}

export async function sendPrompt(prompt: string): Promise<string> {
  const workerUrl = import.meta.env.VITE_WORKER_URL;

  if (!workerUrl) {
    console.error("VITE_WORKER_URL is not set. Please check your frontend/.env.local file.");
    return "Configuration error: Worker URL not found.";
  }

  try {
    const response = await fetch(`${workerUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from worker (status: ${response.status}):`, errorText);
      throw new Error("Failed to get a response from the worker.");
    }

    const data: WorkerResponse = await response.json();

    if (data.response) {
      return data.response;
    }

    throw new Error(data.error || "Received an unknown error from the worker.");

  } catch (error) {
    console.error("Fetch request to worker failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`An unknown error occurred: ${String(error)}`);
  }
}