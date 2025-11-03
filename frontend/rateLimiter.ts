const MAX_REQUESTS = 5;
const TIME_WINDOW_MS = 60 * 1000; // 1 minute

const requestTimestamps: number[] = [];

export function checkRateLimit(): { allowed: boolean; message?: string } {
  const now = Date.now();

  // Remove timestamps older than the time window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - TIME_WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS) {
    return {
      allowed: false,
      message: "You're sending messages too quickly. Please wait a moment before sending another.",
    };
  }

  return { allowed: true };
}

export function recordRequest() {
  requestTimestamps.push(Date.now());
}
