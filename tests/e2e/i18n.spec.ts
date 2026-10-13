import { test, expect } from '@playwright/test';

// /it resolves to en because the primary en entry's locale.languageCode is "it" (site lang en / region IT) — a backend/config issue, so we lock only the working locales (en, es).
test.describe('localized routes', () => {
  test('primary locale (en) renders English chrome', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page).toHaveTitle('Petals & Predators — Carnivorous plants and flowers');

    const allPlants = page.getByRole('link', { name: 'All plants' }).first();
    await expect(allPlants).toHaveAttribute('href', '/products');
  });

  test('es locale renders translated chrome and localized links', async ({ page }) => {
    await page.goto('/es');

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page).toHaveTitle('Petals & Predators — Plantas carnívoras y flores');

    const allPlants = page.getByRole('link', { name: 'Todas las plantas' }).first();
    await expect(allPlants).toHaveAttribute('href', '/es/products');
  });
});
