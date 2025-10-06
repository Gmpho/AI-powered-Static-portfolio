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
 */
export const TRIPWIRE =
	/(\b(curl|wget|bash|sh|zsh|fish|nc|netcat|python|perl|ruby|php|node|deno|bun|java|go|gcc|g\+\+|make|cmake|git|svn|rm|mv|cp|ln|chmod|chown|sudo|su|ssh|scp|ftp|sftp|telnet|nmap|masscan|hydra|john|hashcat|sqlmap|yersinia|metasploit|msfconsole|msfvenom|searchsploit|exploitdb|openvas|nessus|burp|zap|capec|cve|apt|yum|dnf|pacman|apk|brew|docker|kubectl|systemctl|launchctl|cat|ls|grep|find|awk|sed|base64|api_key|sk-|bearer|token|secret|password|key|-----BEGIN|exec|eval\(|system\(|spawn|fork|require|import|include|load|open|read|write|file|socket|connect|listen|bind|shell_exec|passthru|proc_open|popen|pcntl_exec)\b|\/etc\/passwd|\/etc\/shadow|~\/.ssh|\b(2>|1>|>>|<<|`|\$|\(|\)|\{|\}|;|=)|&&|\|\||&)/i;

/**
 * Sanitizes LLM output: removes HTML/script tags, data URIs, long base64, and key-like tokens.
 */
export function sanitizeOutput(text: string): string {
	let cleaned = text
		// Strip script tags and inline scripts
		.replace(/<script\b[^<]*(?:(?!<\/script>)[^<]*)*<\/script>/gi, '[Script removed]')
		// Strip HTML tags
		.replace(/<[^>]*>/g, '')
		// Strip data: URIs and base64 blobs
		.replace(/data:[^ \t\r\n,]*(?:base64,)?[A-Za-z0-9+\/]{50,}={0,2}/gi, '[Encoded data removed]')
		// Redact API key-like tokens
		.replace(/(sk-[A-Za-z0-9]{35,}|api_key=[^ \t\r\n]*|ghp_[A-Za-z0-9]{36,}|-----BEGIN [A-Z]+ PRIVATE KEY-----)/gi, '[API Key redacted]');
	return cleaned.trim();
}

/**
 * Checks for injection patterns (for tests).
 */
export function checkInjection(input: string): boolean {
	return TRIPWIRE.test(input);
}
