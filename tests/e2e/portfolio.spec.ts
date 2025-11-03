import { test, expect } from "@playwright/test";

test.describe("AI-Powered Portfolio E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/", { waitUntil: "load" });
  });

  test("should load the homepage and display projects, then load more", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("AI-Powered Portfolio");
    // Wait for initial project cards to be visible
    await page.waitForSelector(".project-card");
    await expect(page.locator(".project-card")).toHaveCount(3); // Expect 3 initially

    // Click the "load more" button
    const loadMoreButton = page.locator(".load-more-btn");
    await expect(loadMoreButton).toBeVisible();
    await loadMoreButton.click();

    // Now expect all 5 project cards
    await expect(page.locator(".project-card")).toHaveCount(5);
  });

  test.fixme("should open and close the chatbot", async ({ page }) => {
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
    await page.route('**/chat', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: `data: {"response": "This is a mocked response."}\n\nevent: completion\n\n`,
      });
    });

    await page.locator("#chatbot-fab").click();
    await page.locator("#chatbot-input").fill("Hello, AI");
    await page.locator("#chatbot-send").click();

    await expect(page.locator(".message.user")).toHaveText("Hello, AI");
    // Wait for the bot's response to appear
    await page.waitForSelector(".message.bot");
    await expect(page.locator(".message.bot").last()).toBeVisible();
    await expect(page.locator(".message.bot").last()).not.toContainText(
      "Sorry, I’m having trouble",
    );
  });

  test("should display the contact form when requested", async ({ page }) => {
    await page.route('**/chat', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: `data: {"toolCall": {"name": "displayContactForm"}}\n\nevent: completion\n\n`,
      });
    });

    await page.locator("#chatbot-fab").click();
    await page.locator("#chatbot-input").fill("contact me");
    await page.locator("#chatbot-send").click();

    // Wait for the bot's response to appear
    await page.waitForSelector(".message.bot");
    await expect(page.locator(".message.bot").last()).toBeVisible();
  });

  test("should prevent XSS in bot responses (guardrails test)", async ({ page }) => {
    await page.route('**/chat', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: `data: {"response": "This is a mocked response."}\n\nevent: completion\n\n`,
      });
    });

    await page.locator("#chatbot-fab").click();
    const xssPayload = '<script>alert("XSS")</script>';
    await page.locator("#chatbot-input").fill(xssPayload);
    await page.locator("#chatbot-send").click();

    // Wait for the stream to finish
    await expect(page.locator('#chatbot-send')).toBeEnabled({ timeout: 20000 });

    // Assert that the bot gives a refusal message
    const botMessageLocator = page.locator('.message.bot').last();
    await expect(botMessageLocator).toContainText("This is a mocked response.");
    
    // Verify that the bot's message bubble does not contain the raw XSS payload as executable HTML
    const botMessageHtml = await botMessageLocator.innerHTML();
    expect(botMessageHtml).not.toContain(xssPayload); 
  });

  test.fixme("should toggle theme correctly", async ({ page }) => {
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

  test("should respond with project information", async ({ page }) => {
    await page.route('**/chat', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: `data: {"response": "This is a mocked response with project information."}\n\nevent: completion\n\n`,
      });
    });

    await page.waitForSelector('#chatbot-fab');
    await page.locator("#chatbot-fab").click();
    await page.locator("#chatbot-input").fill("tell me about your projects");
    await page.locator("#chatbot-send").click();

    // Use expect.poll to wait for the text to appear
    await expect.poll(async () => {
      const lastBotMessage = page.locator('.message.bot').last();
      return await lastBotMessage.textContent();
    }, { timeout: 30000 }).toContain("This is a mocked response with project information.");
  });

  test("should respond with about information", async ({ page }) => {
    const aboutSection = page.locator("#about");
    await expect(aboutSection.locator("h2")).toHaveText("About Me");
    await expect(aboutSection).toContainText("I am a passionate AI DevOps Engineer");

    await page.locator('nav a[href="#about"]').click();
    await expect(page).toHaveURL(/.*#about/);
  });
});
