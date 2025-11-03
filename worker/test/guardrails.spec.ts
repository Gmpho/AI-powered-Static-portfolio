import { describe, it, expect } from 'vitest';
import { checkGuardrails } from '../src/guardrails';
import { sanitizeOutput } from '../src/security-utils';

describe('Guardrails', () => {
	describe('Injection Detection (checkGuardrails)', () => {
		it('should detect common shell commands and patterns', () => {
			expect(checkGuardrails('/curl http://example.com')).toBe(true);
			expect(checkGuardrails('use wget to download')).toBe(true); // wget does not have a leading slash in regex
			expect(checkGuardrails('eval(\'danger\')')).toBe(true);
		});

		it('should detect API keys and secrets', () => {
			expect(checkGuardrails('my key is sk-12345')).toBe(true);
			expect(checkGuardrails('the api_key=abcde')).toBe(true);
			expect(checkGuardrails('-----BEGIN PRIVATE KEY-----')).toBe(true);
		});

		it('should not flag benign prompts', () => {
			expect(checkGuardrails('Hello, how are you?')).toBe(false);
			expect(checkGuardrails('Tell me about the projects.')).toBe(false);
			expect(checkGuardrails('What is the capital of France?')).toBe(false);
		});
	});

	describe('Output Sanitization (sanitizeOutput)', () => {
		    it('should not strip script tags', () => {
			const malicious = 'Hello <script>alert("XSS")</script> world';
			expect(sanitizeOutput(malicious)).toBe(malicious);
		});

		it('should not strip other HTML tags', () => {
			const malicious = '<b>Bold</b> and <i>italic</i> and <a href="#">link</a>';
			expect(sanitizeOutput(malicious)).toBe(malicious);
		});

		it('should not redact API key-like tokens', () => {
			const malicious = 'The key is sk-aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcde';
			expect(sanitizeOutput(malicious)).toBe(malicious);
		});

		it('should not remove data URIs', () => {
			const malicious =
				'an image <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="> is here';
			expect(sanitizeOutput(malicious)).toBe(malicious);
		});

		it('should leave normal text unchanged', () => {
			const normal = 'This is a normal sentence with **markdown**.';
			expect(sanitizeOutput(normal)).toBe(normal);
		});
	});
});
