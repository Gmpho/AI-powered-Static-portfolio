import { test, expect } from '@playwright/test';

test.describe('About Me Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('3.1. Verify that the "About Me" section is visible.', async ({ page }) => {
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection.locator('h2')).toHaveText('About Me');
  });

  test('3.2. Verify that the social media links (GitHub, LinkedIn) are present and correct.', async ({ page }) => {
    const githubLink = page.locator('a[aria-label="GitHub Profile"]');
    const linkedinLink = page.locator('a[aria-label="LinkedIn Profile"]');

    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/Gmpho');
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/gift-mpho-a5a536173');
  });
});
