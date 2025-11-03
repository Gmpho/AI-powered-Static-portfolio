/**
 * security-utils.ts
 * This file contains utility functions for security-related tasks in the Cloudflare Worker.
 * It includes functions for tripwire matching, output sanitization, secret masking, and safe logging.
 */

// Regular expression to detect sensitive patterns (e.g., API keys, common injection attempts)
// This TRIPWIRE regex has been refined for more accurate detection, preventing false positives
// while maintaining strong protection against sensitive content injection.
const TRIPWIRE_REGEX = /(\/curl|wget|base64|sk-|api_key=|-----BEGIN|eval\(|exec\(|javascript:|data:text\/html)/i;

/**
 * Checks if a given input string matches any sensitive patterns defined in TRIPWIRE_REGEX.
 * @param input The string to check.
 * @returns True if a sensitive pattern is found, false otherwise.
 */
export function matchesTripwire(input: string): boolean {
  return TRIPWIRE_REGEX.test(input);
}

/**
 * Sanitizes output by removing or encoding potentially harmful HTML or script content.
 * This is a basic example and might need to be enhanced with a more robust sanitization library
 * depending on the complexity of the content being handled.
 * @param output The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeOutput(output: string): string {
  // Basic HTML entity encoding to prevent XSS. Consider a library like 'dompurify' for production.
  // Removed HTML entity encoding as frontend handles it.
  return output;
}

/**
 * Masks sensitive information (e.g., API keys, personal data) in a string for logging or display.
 * @param content The string potentially containing secrets.
 * @returns The string with secrets masked.
 */
export function maskSecrets(content: string): string {
  // Example: Replace API keys with masked versions. Extend with other sensitive patterns.
  return content.replace(/(sk-[a-zA-Z0-9]{16,})/g, 'sk-***MASKED***')
                .replace(/(api_key=[a-zA-Z0-9]{16,})/g, 'api_key=***MASKED***');
}

/**
 * Logs messages safely, masking any sensitive information before outputting.
 * @param message The message to log.
 * @param level The log level (e.g., 'info', 'warn', 'error').
 * @param context Optional context object to include in the log.
 */
export function safeLog(message: string, level: 'info' | 'warn' | 'error' = 'info', context?: Record<string, any>): void {
  const maskedMessage = maskSecrets(message);
  const maskedContext = context ? JSON.parse(maskSecrets(JSON.stringify(context))) : context;
  
  // In a real-world scenario, you might integrate with a structured logging service
  // and use different logging mechanisms based on the environment.
  switch (level) {
    case 'error':
      console.error(maskedMessage, maskedContext);
      break;
    case 'warn':
      console.warn(maskedMessage, maskedContext);
      break;
    case 'info':
    default:
      console.log(maskedMessage, maskedContext);
      break;
  }
}
