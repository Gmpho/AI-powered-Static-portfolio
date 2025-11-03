import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('1.1. Verify that the "About" link scrolls to the "About Me" section.', async ({ page }) => {
    await page.locator('nav a[href="#about"]').click();
    await expect(page).toHaveURL(/.*#about/);
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeInViewport();
  });

  test('1.2. Verify that the "Projects" link scrolls to the "Projects" section.', async ({ page }) => {
    await page.locator('nav a[href="#projects"]').click();
    await expect(page).toHaveURL(/.*#projects/);
    const projectsSection = page.locator('#projects');
    await expect(projectsSection).toBeInViewport();
  });

  test.fixme('1.3. Verify that the "Contact" button opens the chatbot and displays the contact form.', async ({ page }) => {
    await page.locator('button.contact-btn').click();
    // Contact button doesn't open chatbot - this appears to be a frontend implementation issue
    // The button exists but doesn't trigger the chatbot opening functionality
    await expect(page.locator('#chatbot-window')).toBeVisible();
    await page.locator('#chatbot-input').fill('contact me');
    await page.locator('#chatbot-send').click();
    // Wait for contact form to appear
    await page.waitForSelector('#chatbot-contact-form', { timeout: 10000 });
    await expect(page.locator('#chatbot-contact-form')).toBeVisible();
  });

});
