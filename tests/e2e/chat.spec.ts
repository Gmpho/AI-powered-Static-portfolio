import { test, expect } from '@playwright/test';

test('should allow a user to send a message and receive a response', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');

  // Click the chatbot FAB to open the chat window
  const fab = page.locator('#chatbot-fab');
  await expect(fab).toBeVisible();
  await fab.click();

  // Wait for the chat window to be visible
  await expect(page.locator('#chatbot-window')).toBeVisible();

  const chatInput = page.locator('#chatbot-input');
  const sendButton = page.locator('#chatbot-send');
  const chatMessages = page.locator('#chatbot-messages');

  // Type a message into the input
  await chatInput.fill('Hello, who are you?');

  // Click the send button
  await sendButton.click();

  // Check that the user's message appears in the history
  await expect(chatMessages).toContainText('Hello, who are you?');

  // Wait for the bot's response
  // We increase the timeout because the AI response can be slow
  const botResponseLocator = chatMessages.locator('.message.bot').last();
  await expect(botResponseLocator).toBeVisible({ timeout: 60000 });

  // Check that the bot's message is not empty
  const botResponse = await botResponseLocator.textContent();
  expect(botResponse?.trim()).not.toBe('');
  console.log(`Received bot response: "${botResponse}"`);
});

test.skip('should handle a project search query', async ({ page }) => {
  await page.goto('/');
  const fab = page.locator('#chatbot-fab');
  await fab.click();
  await expect(page.locator('#chatbot-window')).toBeVisible();

  const chatInput = page.locator('#chatbot-input');
  const sendButton = page.locator('#chatbot-send');
  const chatMessages = page.locator('#chatbot-messages');

  await chatInput.fill('Tell me about a project that uses TypeScript');
  await sendButton.click();

  const botResponseLocator = chatMessages.locator('.message.bot').last();
  await expect(botResponseLocator).toBeVisible({ timeout: 60000 });

  const botResponseText = await botResponseLocator.textContent();
  // The bot should mention a relevant project.
  // This assertion is flexible to allow for different LLM responses.
  expect(botResponseText).toMatch(/AI-Powered Portfolio|AI Resume Analyzer/i);
});

test('should display and handle the contact form', async ({ page }) => {
  await page.goto('/');
  const fab = page.locator('#chatbot-fab');
  await fab.click();
  await expect(page.locator('#chatbot-window')).toBeVisible();

  const chatInput = page.locator('#chatbot-input');
  const sendButton = page.locator('#chatbot-send');
  const chatMessages = page.locator('#chatbot-messages');

  await chatInput.fill('I want to get in touch');
  await sendButton.click();

  // Check that the contact form is displayed
  const contactForm = page.locator('#chatbot-contact-form');
  await expect(contactForm).toBeVisible({ timeout: 10000 });

  // Fill out the form
  await page.locator('#contact-name').fill('Test User');
  await page.locator('#contact-email').fill('test@example.com');
  await page.locator('#contact-message').fill('This is a test message.');

  // Submit the form
  await page.locator('.contact-submit-btn').click();

  // Check for the confirmation message
  const confirmationMessage = chatMessages.locator('.message.bot').last();
  await expect(confirmationMessage).toContainText('Thanks, Test User! Your message has been sent.', { timeout: 5000 });
});
