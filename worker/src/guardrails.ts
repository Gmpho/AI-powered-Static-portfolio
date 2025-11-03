/**
 * guardrails.ts
 * This file defines explicit tripwire rules and can integrate with moderation hooks
 * to enhance the security and safety of the AI-powered portfolio chatbot.
 */

import { matchesTripwire, safeLog } from './security-utils';

/**
 * Checks if the given input violates any defined guardrail rules.
 * This function can be extended to include more sophisticated checks,
 * such as calling a moderation API or applying more complex regex patterns.
 * @param input The user input string to check against guardrails.
 * @returns True if the input violates a guardrail, false otherwise.
 */
export function checkGuardrails(input: string): boolean {
  // 1. Tripwire Check: Detect sensitive patterns or potential injection attempts.
  if (matchesTripwire(input)) {
    safeLog('Guardrail triggered: Tripwire pattern detected', 'warn', { input });
    return true;
  }

  // 2. Content Moderation (Example - can be extended):
  // In a production environment, you might integrate with a content moderation API here.
  // For example:
  // const moderationResult = await callModerationApi(input);
  // if (moderationResult.isUnsafe) {
  //   safeLog('Guardrail triggered: Content moderation flagged unsafe input', 'warn', { input, moderationResult });
  //   return true;
  // }

  // 3. Length Limits (Example):
  // Prevent excessively long inputs that could be used for denial-of-service or prompt injection.
  const MAX_INPUT_LENGTH = 1000; // Define a reasonable max length
  if (input.length > MAX_INPUT_LENGTH) {
    safeLog('Guardrail triggered: Input exceeds maximum length', 'warn', { inputLength: input.length });
    return true;
  }

  // Add more guardrail checks as needed

  return false;
}

/**
 * Provides a generic message to the user when a guardrail is triggered.
 * @returns A polite error message.
 */
export function getGuardrailMessage(): string {
  return 'I apologize, but your request contains content that I cannot process. Please rephrase your query.';
}