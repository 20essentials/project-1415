import { test, expect } from '@playwright/test';
// Seeded Donations (see .wix/seeded.json → donations): campaign "New local",
// one-time only, presets €10/€25/€50/€100, custom minimum €5. Assertions cover
// this repo's SSR chrome and the seeded campaign name only — the checkout
// itself is covered by unit tests, since it writes real Wix-side data we
// don't control.

test.describe('donations', () => {
  test('the donate page renders the seeded campaign with its form island', async ({ page }) => {
    const response = await page.goto('/donate');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('New local');
    const form = page.locator('form[data-testid="donate-form"]');
    await expect(form).toBeVisible();
  });

  test('the thank-you page renders and stays out of search indexes', async ({ page }) => {
    const response = await page.goto('/donations/thank-you');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
  });

  test('the donate page is localized for Spanish visitors', async ({ page }) => {
    const response = await page.goto('/es/donate');
    expect(response?.status()).toBe(200);

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});
