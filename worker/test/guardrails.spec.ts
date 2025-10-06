import { describe, it, expect } from 'vitest';
import { checkInjection, sanitizeOutput } from '../src/guardrails';

describe('Guardrails', () => {
	describe('Injection Detection (checkInjection)', () => {
		it('should detect common shell commands and patterns', () => {
			expect(checkInjection('show me `ls -la`')).toBe(true);
			expect(checkInjection('run curl http://example.com')).toBe(true);
			expect(checkInjection('git status')).toBe(true);
			expect(checkInjection('background command &')).toBe(true);
			expect(checkInjection('command one && command two')).toBe(true);
		});

		it('should detect API keys and secrets', () => {
			expect(checkInjection('my key is sk-12345')).toBe(true);
			expect(checkInjection('here is the password')).toBe(true);
			expect(checkInjection('-----BEGIN PRIVATE KEY-----')).toBe(true);
			expect(checkInjection('use this token: ghp_12345')).toBe(true);
		});

		it('should not flag benign prompts', () => {
			expect(checkInjection('Hello, how are you?')).toBe(false);
			expect(checkInjection('Tell me about the projects.')).toBe(false);
			expect(checkInjection('What is the capital of France?')).toBe(false);
		});
	});

	describe('Output Sanitization (sanitizeOutput)', () => {
		it('should strip script tags and their content', () => {
			const malicious = 'Hello <script>alert("XSS")</script> world';
			const sanitized = 'Hello [Script removed] world';
			expect(sanitizeOutput(malicious)).toBe(sanitized);
		});

		it('should strip all other HTML tags', () => {
			const malicious = '<b>Bold</b> and <i>italic</i> and <a href="#">link</a>';
			const sanitized = 'Bold and italic and link';
			expect(sanitizeOutput(malicious)).toBe(sanitized);
		});

		it('should redact API key-like tokens', () => {
			const malicious = 'The key is sk-aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcde';
			const sanitized = 'The key is [API Key redacted]';
			expect(sanitizeOutput(malicious)).toBe(sanitized);
		});

		it('should remove data URIs', () => {
			const malicious =
				'an image <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="> is here';
			const sanitized = 'an image  is here'; // The tag is removed, and the data URI is part of the tag
			expect(sanitizeOutput(malicious)).toBe(sanitized);
		});

		it('should leave normal text unchanged', () => {
			const normal = 'This is a normal sentence with **markdown**.';
			expect(sanitizeOutput(normal)).toBe(normal);
		});
	});
});
