import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('2.1. Verify that the theme toggle button exists.', async ({ page }) => {
    const themeToggleBtn = page.locator('#theme-toggle');
    await expect(themeToggleBtn).toBeVisible();
  });

  test.fixme('2.2. Verify that clicking the theme toggle button changes the theme of the page.', async ({ page }) => {
    const themeToggleBtn = page.locator('#theme-toggle');
    const htmlElement = page.locator('html');

    const initialTheme = await htmlElement.getAttribute('data-theme');
    await themeToggleBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', initialTheme === 'dark' ? 'light' : 'dark');

    await themeToggleBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', initialTheme === 'dark' ? 'dark' : 'light');
  });
});
