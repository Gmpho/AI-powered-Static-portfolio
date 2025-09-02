interface WorkerResponse {
  response?: string;
  error?: string;
}

export async function sendPrompt(prompt: string): Promise<string> {
  const response = await fetch("https://gemini-worker.gift.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data: WorkerResponse = await response.json();
  if (data.response) return data.response;
  throw new Error(data.error || "Unknown error from Gemini Worker");
}
