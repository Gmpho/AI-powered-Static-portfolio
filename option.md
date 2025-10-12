
giftmpho@AG:/mnt/c/Users/giftm/Desktop/AI-powered-Static-portfolio$ npm run test:e2e

> ai-powered-static-portfolio@0.0.0 test:e2e
> npx playwright test


Running 8 tests using 2 workers
  1) [chromium] › tests/e2e/portfolio.spec.ts:53:3 › AI-Powered Portfolio E2E Tests › should open and close the chatbot 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for locator('#chatbot-close')
        - locator resolved to <button id="chatbot-close" class="chatbot-close" aria-label="Close chat">…</button>
      - attempting click action
        2 × waiting for element to be visible, enabled and stable
          - element is not stable
        - retrying click action
        - waiting 20ms
        - waiting for element to be visible, enabled and stable
        - element is not stable
      2 × retrying click action
          - waiting 100ms
          - waiting for element to be visible, enabled and stable
          - element is not visible
      10 × retrying click action
           - waiting 500ms
           - waiting for element to be visible, enabled and stable
           - element is not visible
      - retrying click action
        - waiting 500ms


      59 |     await chatbotFab.click();
      60 |     await expect(chatbotWindow).toBeVisible();
    > 61 |     await chatbotCloseBtn.click();
         |                           ^
      62 |     await expect(chatbotWindow).toBeHidden();
      63 |   });
      64 |
        at /mnt/c/Users/giftm/Desktop/AI-powered-Static-portfolio/tests/e2e/portfolio.spec.ts:61:27

    Error Context: test-results/portfolio-AI-Powered-Portf-5569c--open-and-close-the-chatbot-chromium/error-context.md

  2) [chromium] › tests/e2e/portfolio.spec.ts:65:3 › AI-Powered Portfolio E2E Tests › should send a message and receive a streamed bot response 

    Test timeout of 30000ms exceeded.

    Error: expect(locator).toContainText(expected) failed

    Locator: locator('.message.bot').last()
    - Expected substring  - 1
    + Received string     + 2

    - Hello there!How can I help you today?
    + How can I help you today?
    +

    Call log:
      - Expect "toContainText" with timeout 5000ms
      - waiting for locator('.message.bot').last()
        8 × locator resolved to <div class="message bot">…</div>
          - unexpected value "How can I help you today?
    "


      82 |     // Wait for the bot's full response to appear
      83 |     await page.waitForSelector(".message.bot:has-text('How can I help you today?')");
    > 84 |     await expect(page.locator(".message.bot").last()).toContainText("Hello there!How can I help you today?");
         |                                                       ^
      85 |   });
      86 |
      87 |   test("should handle projectSearch tool call and display results", async ({ page }) => {
        at /mnt/c/Users/giftm/Desktop/AI-powered-Static-portfolio/tests/e2e/portfolio.spec.ts:84:55

    Error Context: test-results/portfolio-AI-Powered-Portf-b6e3f-ive-a-streamed-bot-response-chromium/error-context.md

  3) [chromium] › tests/e2e/portfolio.spec.ts:87:3 › AI-Powered Portfolio E2E Tests › should handle projectSearch tool call and display results 

    Error: expect(locator).toContainText(expected) failed

    Locator: locator('.message.bot').last()
    Timeout: 5000ms
    - Expected substring  - 1
    + Received string     + 4

    - Here are some AI projects:- Project Alpha (AI/ML)- Project Beta (NLP)
    +
    + Project Beta (NLP)
    +
    +

    Call log:
      - Expect "toContainText" with timeout 5000ms
      - waiting for locator('.message.bot').last()
        9 × locator resolved to <div class="message bot">…</div>
          - unexpected value "
    Project Beta (NLP)

    "


      114 |     await expect(page.locator(".message.user")).toHaveText("Show me AI projects");
      115 |     await page.waitForSelector(".message.bot:has-text('Here are some AI projects:')");
    > 116 |     await expect(page.locator(".message.bot").last()).toContainText("Here are some AI projects:- Project Alpha (AI/ML)- Project Beta (NLP)");   
          |                                                       ^
      117 |   });
      118 |
      119 |   test("should display the contact form when requested via tool call", async ({ page }) => {
        at /mnt/c/Users/giftm/Desktop/AI-powered-Static-portfolio/tests/e2e/portfolio.spec.ts:116:55

    Error Context: test-results/portfolio-AI-Powered-Portf-7fc1d-ol-call-and-display-results-chromium/error-context.md

  4) [chromium] › tests/e2e/portfolio.spec.ts:119:3 › AI-Powered Portfolio E2E Tests › should display the contact form when requested via tool call 

    Test timeout of 30000ms exceeded.

    Error: expect(locator).toBeVisible() failed

    Locator: locator('.message.bot:has(#chatbot-contact-form)')
    Expected: visible
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for locator('.message.bot:has(#chatbot-contact-form)')


      143 |     await expect(page.locator("#chatbot-window")).toBeVisible();
      144 |     // Wait for the bot message containing the contact form to be visible
    > 145 |     await expect(page.locator(".message.bot:has(#chatbot-contact-form)")).toBeVisible({ timeout: 15000 });
          |                                                                           ^
      146 |     await expect(page.locator("#contact-name")).toBeVisible();
      147 |     await expect(page.locator("#contact-email")).toBeVisible();
      148 |     await expect(page.locator("#contact-message")).toBeVisible();
        at /mnt/c/Users/giftm/Desktop/AI-powered-Static-portfolio/tests/e2e/portfolio.spec.ts:145:75

    Error Context: test-results/portfolio-AI-Powered-Portf-4f6a4-hen-requested-via-tool-call-chromium/error-context.md

  5) [chromium] › tests/e2e/portfolio.spec.ts:151:3 › AI-Powered Portfolio E2E Tests › should prevent XSS in bot responses (guardrails test) 

    Test timeout of 30000ms exceeded.

    Error: expect(locator).toContainText(expected) failed

    Locator: locator('.message.bot').last()
    - Expected substring  - 1
    + Received string     + 2

    - Sensitive content detected in prompt.
    + Hello! How can I help you?
    +

    Call log:
      - Expect "toContainText" with timeout 10000ms
      - waiting for locator('.message.bot').last()
        12 × locator resolved to <div class="message bot">…</div>
           - unexpected value "Hello! How can I help you?
    "


      157 |     // Wait for the bot's response to appear and contain the expected text
      158 |     const botMessageLocator = page.locator('.message.bot').last();
    > 159 |     await expect(botMessageLocator).toContainText("Sensitive content detected in prompt.", { timeout: 10000 });
          |                                     ^
      160 |
      161 |     // Verify that the bot's message bubble does not contain the raw XSS payload as executable HTML
      162 |     const botMessageHtml = await botMessageLocator.innerHTML();
        at /mnt/c/Users/giftm/Desktop/AI-powered-Static-portfolio/tests/e2e/portfolio.spec.ts:159:37

    Error Context: test-results/portfolio-AI-Powered-Portf-ae78b--responses-guardrails-test--chromium/error-context.md

  5 failed
    [chromium] › tests/e2e/portfolio.spec.ts:53:3 › AI-Powered Portfolio E2E Tests › should open and close the chatbot 
    [chromium] › tests/e2e/portfolio.spec.ts:65:3 › AI-Powered Portfolio E2E Tests › should send a message and receive a streamed bot response
    [chromium] › tests/e2e/portfolio.spec.ts:87:3 › AI-Powered Portfolio E2E Tests › should handle projectSearch tool call and display results
    [chromium] › tests/e2e/portfolio.spec.ts:119:3 › AI-Powered Portfolio E2E Tests › should display the contact form when requested via tool call
    [chromium] › tests/e2e/portfolio.spec.ts:151:3 › AI-Powered Portfolio E2E Tests › should prevent XSS in bot responses (guardrails test)
  3 passed (4.1m)

  Serving HTML report at http://localhost:9323. Press Ctrl+C to quit.

 npm run test:e2e

> ai-powered-static-portfolio@0.0.0 test:e2e
> npx playwright test


Running 8 tests using 2 workers
  1) [chromium] › tests\e2e\portfolio.spec.ts:46:3 › AI-Powered Portfolio E2E Tests › should load the homepage and display projects 

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      40 |
      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
    > 42 |   test.beforeEach(async ({ page }) => {
         |        ^
      43 |     await page.goto("/");
      44 |   });
      45 |
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:42:8

    Error: page.goto: Test timeout of 30000ms exceeded.
    Call log:
      - navigating to "http://localhost:5173/", waiting until "load"


      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
      42 |   test.beforeEach(async ({ page }) => {
    > 43 |     await page.goto("/");
         |                ^
      44 |   });
      45 |
      46 |   test("should load the homepage and display projects", async ({ page }) => {
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:43:16

    Error Context: test-results\portfolio-AI-Powered-Portf-5249a-mepage-and-display-projects-chromium\error-context.md

  2) [chromium] › tests\e2e\portfolio.spec.ts:53:3 › AI-Powered Portfolio E2E Tests › should open and close the chatbot 

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      40 |
      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
    > 42 |   test.beforeEach(async ({ page }) => {
         |        ^
      43 |     await page.goto("/");
      44 |   });
      45 |
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:42:8

    Error: page.goto: Test timeout of 30000ms exceeded.
    Call log:
      - navigating to "http://localhost:5173/", waiting until "load"


      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
      42 |   test.beforeEach(async ({ page }) => {
    > 43 |     await page.goto("/");
         |                ^
      44 |   });
      45 |
      46 |   test("should load the homepage and display projects", async ({ page }) => {
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:43:16

  3) [chromium] › tests\e2e\portfolio.spec.ts:65:3 › AI-Powered Portfolio E2E Tests › should send a message and receive a streamed bot response 

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      40 |
      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
    > 42 |   test.beforeEach(async ({ page }) => {
         |        ^
      43 |     await page.goto("/");
      44 |   });
      45 |
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:42:8

    Error: page.goto: Test timeout of 30000ms exceeded.
    Call log:
      - navigating to "http://localhost:5173/", waiting until "load"


      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
      42 |   test.beforeEach(async ({ page }) => {
    > 43 |     await page.goto("/");
         |                ^
      44 |   });
      45 |
      46 |   test("should load the homepage and display projects", async ({ page }) => {
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:43:16

  4) [chromium] › tests\e2e\portfolio.spec.ts:87:3 › AI-Powered Portfolio E2E Tests › should handle projectSearch tool call and display results 

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      40 |
      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
    > 42 |   test.beforeEach(async ({ page }) => {
         |        ^
      43 |     await page.goto("/");
      44 |   });
      45 |
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:42:8

    Error: page.goto: Test timeout of 30000ms exceeded.
    Call log:
      - navigating to "http://localhost:5173/", waiting until "load"


      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
      42 |   test.beforeEach(async ({ page }) => {
    > 43 |     await page.goto("/");
         |                ^
      44 |   });
      45 |
      46 |   test("should load the homepage and display projects", async ({ page }) => {
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:43:16

  5) [chromium] › tests\e2e\portfolio.spec.ts:119:3 › AI-Powered Portfolio E2E Tests › should display the contact form when requested via tool call 

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      40 |
      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
    > 42 |   test.beforeEach(async ({ page }) => {
         |        ^
      43 |     await page.goto("/");
      44 |   });
      45 |
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:42:8

    Error: page.goto: Test timeout of 30000ms exceeded.
    Call log:
      - navigating to "http://localhost:5173/", waiting until "load"


      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
      42 |   test.beforeEach(async ({ page }) => {
    > 43 |     await page.goto("/");
         |                ^
      44 |   });
      45 |
      46 |   test("should load the homepage and display projects", async ({ page }) => {
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:43:16

  6) [chromium] › tests\e2e\portfolio.spec.ts:151:3 › AI-Powered Portfolio E2E Tests › should prevent XSS in bot responses (guardrails test) 

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      40 |
      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
    > 42 |   test.beforeEach(async ({ page }) => {
         |        ^
      43 |     await page.goto("/");
      44 |   });
      45 |
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:42:8

    Error: page.goto: Test timeout of 30000ms exceeded.
    Call log:
      - navigating to "http://localhost:5173/", waiting until "load"


      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
      42 |   test.beforeEach(async ({ page }) => {
    > 43 |     await page.goto("/");
         |                ^
      44 |   });
      45 |
      46 |   test("should load the homepage and display projects", async ({ page }) => {
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:43:16

  7) [chromium] › tests\e2e\portfolio.spec.ts:166:3 › AI-Powered Portfolio E2E Tests › should toggle theme correctly 

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      40 |
      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
    > 42 |   test.beforeEach(async ({ page }) => {
         |        ^
      43 |     await page.goto("/");
      44 |   });
      45 |
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:42:8

    Error: page.goto: Test timeout of 30000ms exceeded.
    Call log:
      - navigating to "http://localhost:5173/", waiting until "load"


      41 | test.describe("AI-Powered Portfolio E2E Tests", () => {
      42 |   test.beforeEach(async ({ page }) => {
    > 43 |     await page.goto("/");
         |                ^
      44 |   });
      45 |
      46 |   test("should load the homepage and display projects", async ({ page }) => {
        at C:\Users\giftm\Desktop\AI-powered-Static-portfolio\tests\e2e\portfolio.spec.ts:43:16

  7 failed
    [chromium] › tests\e2e\portfolio.spec.ts:46:3 › AI-Powered Portfolio E2E Tests › should load the homepage and display projects 
    [chromium] › tests\e2e\portfolio.spec.ts:53:3 › AI-Powered Portfolio E2E Tests › should open and close the chatbot
    [chromium] › tests\e2e\portfolio.spec.ts:65:3 › AI-Powered Portfolio E2E Tests › should send a message and receive a streamed bot response
    [chromium] › tests\e2e\portfolio.spec.ts:87:3 › AI-Powered Portfolio E2E Tests › should handle projectSearch tool call and display results
    [chromium] › tests\e2e\portfolio.spec.ts:119:3 › AI-Powered Portfolio E2E Tests › should display the contact form when requested via tool call
    [chromium] › tests\e2e\portfolio.spec.ts:151:3 › AI-Powered Portfolio E2E Tests › should prevent XSS in bot responses (guardrails test)
    [chromium] › tests\e2e\portfolio.spec.ts:166:3 › AI-Powered Portfolio E2E Tests › should toggle theme correctly
  1 passed (2.6m)
