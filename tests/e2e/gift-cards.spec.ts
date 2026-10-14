import { test, expect } from '@playwright/test';

// The Wix Gift Cards app is installed on the site through the Apps Installer API
// (apps-installer-service/v1/app-instance/install). Its default "eGift Card"
// product backs this page; if the app or product were missing the page would
// fall back to static copy and the assertions below would fail.
test.describe('gift cards', () => {
  test('the gift card product exists and its purchase form is shown', async ({ page }) => {
    const response = await page.goto('/gift-cards');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1, name: 'eGift Card' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Send a gift card' })).toBeVisible();

    const amountButtons = page.locator('form fieldset button[aria-pressed]');
    await expect(amountButtons.first()).toHaveAttribute('aria-pressed', 'true');
    expect(await amountButtons.count()).toBeGreaterThanOrEqual(1);

    await expect(page.getByLabel(/Recipient first name/)).toBeVisible();
    await expect(page.getByLabel(/Recipient email/)).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeDisabled();

    await expect(page.getByRole('link', { name: 'Browse the collection' })).toHaveCount(0);
  });
});
