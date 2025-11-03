import { describe, it, expect, vi } from 'vitest';
import { matchesTripwire, sanitizeOutput, maskSecrets, safeLog } from '../src/security-utils';
import { checkGuardrails, getGuardrailMessage } from '../src/guardrails';
import { ChatMessageSchema, ChatRequestSchema, ProjectSearchSchema, ContactFormSchema } from '../src/schemas';

describe('security-utils', () => {
  it('should detect tripwire patterns', () => {
    expect(matchesTripwire('/curl evil.com')).toBe(true);
    expect(matchesTripwire('api_key=123')).toBe(true);
    expect(matchesTripwire('-----BEGIN PRIVATE KEY-----')).toBe(true);
    expect(matchesTripwire('normal text')).toBe(false);
  });

  it('should not sanitize HTML output', () => {
    expect(sanitizeOutput('<script>alert(\'xss\')</script>')).toBe('<script>alert(\'xss\')</script>');
    expect(sanitizeOutput('<div>safe content</div>')).toBe('<div>safe content</div>');
  });

  it('should mask secrets', () => {
    expect(maskSecrets('My key is sk-1234567890abcdef')).toBe('My key is sk-***MASKED***');
    expect(maskSecrets('api_key=abcdef1234567890')).toBe('api_key=***MASKED***');
    expect(maskSecrets('no secrets here')).toBe('no secrets here');
  });

  it('should log safely without masking short keys', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    safeLog('logging with sk-123456789');
    expect(consoleSpy).toHaveBeenCalledWith('logging with sk-123456789', undefined);
    consoleSpy.mockRestore();
  });
});

describe('guardrails', () => {
  it('should trigger guardrail for tripwire patterns', () => {
    expect(checkGuardrails('/curl evil.com')).toBe(true);
  });

  it('should not trigger guardrail for safe input', () => {
    expect(checkGuardrails('Hello, how are you?')).toBe(false);
  });

  it('should return correct guardrail message', () => {
    expect(getGuardrailMessage()).toBe('I apologize, but your request contains content that I cannot process. Please rephrase your query.');
  });
});

describe('schemas', () => {
  it('should validate ChatMessageSchema', () => {
    expect(ChatMessageSchema.parse({ role: 'user', content: 'Hello' })).toEqual({ role: 'user', content: 'Hello' });
    expect(() => ChatMessageSchema.parse({ role: 'user', content: '' })).toThrow();
    expect(() => ChatMessageSchema.parse({ role: 'bot', content: 'Hello' })).toThrow(); // Invalid role
  });

  it('should validate ChatRequestSchema', () => {
    const validRequest = { prompt: 'hi', messages: [{ role: 'user', content: 'Hi' }] };
    expect(ChatRequestSchema.parse(validRequest)).toEqual(validRequest);
    expect(() => ChatRequestSchema.parse({ prompt: 'hi', messages: [] })).toThrow();
  });


  it('should validate ProjectSearchSchema', () => {
    expect(ProjectSearchSchema.parse({ query: 'AI projects' })).toEqual({ query: 'AI projects' });
    expect(() => ProjectSearchSchema.parse({ query: '' })).toThrow();
  });

  it('should validate ContactFormSchema', () => {
    const validForm = { name: 'John Doe', email: 'john@example.com', message: 'Hello' };
    expect(ContactFormSchema.parse(validForm)).toEqual(validForm);
    expect(() => ContactFormSchema.parse({ name: '', email: 'a@b.com', message: 'hi' })).toThrow();
    expect(() => ContactFormSchema.parse({ name: 'John', email: 'invalid', message: 'hi' })).toThrow();
  });
});
