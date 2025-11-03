import { test, expect } from '@playwright/test';

test.describe('Projects Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('4.1. Verify that the project cards are loaded and displayed, then load more.', async ({ page }) => {
    test.setTimeout(60000);
    await page.waitForSelector('.project-card');
    const projectCards = page.locator('.project-card');
    await expect(projectCards).toHaveCount(3); // Expect 3 initially

    // Click the "load more" button
    const loadMoreButton = page.locator(".load-more-btn");
    await expect(loadMoreButton).toBeVisible();
    await loadMoreButton.click();

    // Now expect all 5 project cards
    await expect(projectCards).toHaveCount(5);
  });
});
