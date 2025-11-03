import { test, expect } from '@playwright/test';

test.describe('Test group', () => {
  test.skip('seed', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    // generate code here.
  });
});
