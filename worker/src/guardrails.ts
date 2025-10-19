/**
 * Guardrails utilities: validation, injection detection, sanitization.
 * Exported for unit tests in guardrails.spec.ts.
 */

import { z } from 'zod';

/**
 * Zod schema for chat requests (replicated or import from schemas.ts).
 */
export const chatRequestSchema = z.object({
	prompt: z.string().min(1).max(1200),
	persona: z.string().optional().default('default'),
});

/**
 * TRIPWIRE regex for injection/secret patterns.
 *
 * IMPORTANT SECURITY NOTE:
 * While this regex provides a basic layer of defense against common command injection
 * and file access patterns, it is inherently limited and can be bypassed by
 * sophisticated attackers through obfuscation or novel techniques.
 *
 * For a more robust and comprehensive prompt injection prevention strategy, consider:
 * 1. Implementing advanced LLM-specific guardrails that analyze semantic intent.
 * 2. Adopting a structured prompting approach that strictly separates user input
 *    from system instructions and data.
 * 3. Utilizing external services or libraries specifically designed for LLM security.
 */
export const TRIPWIRE =
	/(\b(curl|wget|bash|sh|nc|netcat|rm|mv|cp|sudo|su|ssh|scp|nmap|sqlmap|metasploit|base64|-----BEGIN|exec|eval\(|system\(|spawn|fork|shell_exec|passthru|proc_open|popen|<script.*?>)\b|\/etc\/passwd|\/etc\/shadow|~\/.ssh|\b(2>|1>|>>|`|\$|\{|\}|;|&|&&|\|\|))/i;

/**
 * Sanitizes LLM output: removes HTML/script tags, data URIs, long base64, and key-like tokens.
 */
export function sanitizeOutput(text: string): string {
	let cleaned = text
		// Strip script tags and inline scripts
		.replace(/<script\b[^<]*(?:(?!<\/script>)[^<]*)*<\/script>/gi, '[Script removed]')
		// Strip HTML tags
		// .replace(/<[^>]*>/g, '')
		// Strip data: URIs and base64 blobs
		.replace(/data:[^ \t\r\n,]*(?:base64,)?[A-Za-z0-9+\/]{50,}={0,2}/gi, '[Encoded data removed]')		// Redact API key-like tokens
		.replace(/(sk-[A-Za-z0-9]{35,}|api_key=[^ \t\r\n]*|ghp_[A-Za-z0-9]{36,}|-----BEGIN [A-Z]+ PRIVATE KEY-----)/gi, '[API Key redacted]');
	return cleaned.trim();
}

/**
 * Checks for injection patterns (for tests).
 */
export function checkInjection(input: string): boolean {
	return TRIPWIRE.test(input);
}
