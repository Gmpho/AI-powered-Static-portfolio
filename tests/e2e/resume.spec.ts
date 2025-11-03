import { test, expect } from '@playwright/test';

test.describe('Resume Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('5.1. Verify that the resume is loaded and displayed.', async ({ page }) => {
    const resumeContainer = page.locator('#resume-container');
    await expect(resumeContainer).toBeVisible();
    // Further checks can be added here to verify the content of the resume, e.g., an iframe or a download link.
  });
});
