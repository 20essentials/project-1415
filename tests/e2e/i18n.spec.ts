import { test, expect } from '@playwright/test';

// /it resolves to en because the primary en entry's locale.languageCode is "it" (site lang en / region IT) — a backend/config issue, so we lock only the working locales (en, es).
// No title assertions: the <title> is injected by Wix from the site's SEO settings, not authored in this repo, so asserting it tests Wix config rather than the app.
test.describe('localized routes', () => {
  test('primary locale (en) renders English chrome', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    const allPlants = page.getByRole('link', { name: 'All plants' }).first();
    await expect(allPlants).toHaveAttribute('href', '/products');
  });

  test('es locale renders translated chrome and localized links', async ({ page }) => {
    await page.goto('/es');

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    const allPlants = page.getByRole('link', { name: 'Todas las plantas' }).first();
    await expect(allPlants).toHaveAttribute('href', '/es/products');
  });
});
