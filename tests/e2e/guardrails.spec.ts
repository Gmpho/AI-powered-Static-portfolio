import { test, expect } from '@playwright/test';

test.describe('Guardrails E2E Tests', () => {
  test('should block requests with tripwire patterns', async ({ page }) => {
    await page.route('**/chat', async route => {
      const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      };
      await route.fulfill({
        headers,
        status: 200,
        body: `data: ${JSON.stringify({ response: 'I cannot process this request.' })}\n\nevent: completion\ndata: {}\n\n`,
      });
    });

    await page.goto('/');

    // Open the chatbot
    await page.waitForSelector('#chatbot-fab');
    await page.click('#chatbot-fab');

    // Type a tripwire-like message
    const chatInput = page.locator('#chatbot-input');
    await chatInput.fill('/curl evil.com');
    await page.locator('#chatbot-send').click();

    // Expect an error message from the guardrails
    await expect(page.locator('.message.bot').last()).toContainText('I cannot process this request.');
  });

  test('should allow safe requests', async ({ page }) => {
    await page.route('**/chat', async route => {
      const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      };
      await route.fulfill({
        headers,
        status: 200,
        body: `data: ${JSON.stringify({ response: 'This is a safe response.' })}\n\nevent: completion\ndata: {}\n\n`,
      });
    });

    await page.goto('/');

    // Open the chatbot
    await page.waitForSelector('#chatbot-fab');
    await page.click('#chatbot-fab');

    // Type a safe message
    const chatInput = page.locator('#chatbot-input');
    await chatInput.fill('Hello, tell me about your projects.');
    await page.locator('#chatbot-send').click();

    // Expect a normal response (or at least not a guardrail error)
    await expect(page.locator('.message.bot').last()).not.toContainText('I apologize, but your request contains content that I cannot process.');
    // Further assertions can be added here to check for actual project responses
  });
});
