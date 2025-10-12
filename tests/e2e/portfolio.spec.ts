import { test, expect } from "@playwright/test";

test.describe("AI-Powered Portfolio E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the homepage and display projects", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("AI-Powered Portfolio");
    // Wait for project cards to be visible
    await page.waitForSelector(".project-card");
    await expect(page.locator(".project-card")).toHaveCount(5); // Assuming 5 projects are rendered
  });

  test("should open and close the chatbot", async ({ page }) => {
    const chatbotFab = page.locator("#chatbot-fab");
    const chatbotWindow = page.locator("#chatbot-window");
    const chatbotCloseBtn = page.locator("#chatbot-close");

    await expect(chatbotWindow).toBeHidden();
    await chatbotFab.click();
    await expect(chatbotWindow).toBeVisible();
    await chatbotCloseBtn.click();
    await expect(chatbotWindow).toBeHidden();
  });

  test("should send a message and receive a bot response", async ({ page }) => {
    await page.locator("#chatbot-fab").click();
    await page.locator("#chatbot-input").fill("Hello, AI");
    await page.locator("#chatbot-send").click();

    await expect(page.locator(".message.user")).toHaveText("Hello, AI");
    // Wait for the bot's response to appear
    await page.waitForSelector(".message.bot");
    await expect(page.locator(".message.bot")).toBeVisible();
    await expect(page.locator(".message.bot")).not.toContainText(
      "Sorry, I’m having trouble",
    );
  });

  test("should display the contact form when requested", async ({ page }) => {
    await page.locator("#chatbot-fab").click();
    await page.locator("#chatbot-input").fill("contact me");
    await page.locator("#chatbot-send").click();

    // Ensure the chat window is visible
    await expect(page.locator("#chatbot-window")).toBeVisible();
    // Wait for the bot message containing the contact form to be visible
    await expect(
      page.locator(".message.bot:has(#chatbot-contact-form)"),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-email")).toBeVisible();
    await expect(page.locator("#contact-message")).toBeVisible();
  });

  test("should prevent XSS in bot responses (guardrails test)", async ({ page }) => {
    await page.locator("#chatbot-fab").click();
    const xssPayload = '<script>alert("XSS")</script>';
    await page.locator("#chatbot-input").fill(xssPayload);
    await page.locator("#chatbot-send").click();

    // Wait for the bot's response to appear and contain the expected text
    const botMessageLocator = page.locator('.message.bot').last();
    await expect(botMessageLocator).toContainText("Sensitive content detected in prompt.", { timeout: 10000 });
    
    // Verify that the bot's message bubble does not contain the raw XSS payload as executable HTML
    const botMessageHtml = await botMessageLocator.innerHTML();
    expect(botMessageHtml).not.toContain(xssPayload); 
  });

  test("should toggle theme correctly", async ({ page }) => {
    const themeToggleBtn = page.locator("#theme-toggle");
    const htmlElement = page.locator("html");

    // Initial theme check (should be light by default or system preference)
    const initialTheme = await htmlElement.getAttribute("data-theme");
    expect(initialTheme).toMatch(/light|dark/);

    // Toggle to dark
    await themeToggleBtn.click();
    await expect(htmlElement).toHaveAttribute(
      "data-theme",
      initialTheme === "dark" ? "light" : "dark",
    );

    // Toggle back
    await themeToggleBtn.click();
    await expect(htmlElement).toHaveAttribute(
      "data-theme",
      initialTheme === "dark" ? "dark" : "light",
    );
  });
});
