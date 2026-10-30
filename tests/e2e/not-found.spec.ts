import { test, expect } from '@playwright/test';

test.describe('not found page', () => {
  test('an unknown route returns 404 with the branded recovery page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page has wilted.');
    await expect(page.getByRole('link', { name: 'Browse the shop' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to home', exact: true })).toHaveAttribute(
      'href',
      '/',
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  });
});
