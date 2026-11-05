import { test, expect } from '@playwright/test';

test.describe('faq', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/faq');
    // Interactions wait for the island's hydration marker; SSR is cold in dev.
    await page.waitForFunction(() => document.querySelector('[data-faq-ready]') !== null, null, { timeout: 20000 });
  });

  test('lists seeded categories and opens answers', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /care FAQ/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shipping & returns' })).toBeVisible();

    const question = page.locator('[data-faq-question="q-do-you-ship-in-cold"]');
    await question.click();
    await expect(page.locator('[data-faq-answer="q-do-you-ship-in-cold"]')).toBeVisible();
  });

  test('search filters questions live and can be cleared', async ({ page }) => {
    const search = page.getByPlaceholder(/distilled water/i);
    await search.fill('distilled');

    await expect(page.locator('[data-faq-question="q-is-distilled-water"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shipping & returns' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByRole('heading', { name: 'Shipping & returns' })).toBeVisible();
  });

  test('deep link /faq#q-<slug> opens the question', async ({ page }) => {
    await page.goto('/faq#q-is-distilled-water');
    await page.waitForFunction(() => document.querySelector('[data-faq-ready]') !== null, null, { timeout: 20000 });

    await expect(page.locator('[data-faq-question="q-is-distilled-water"]')).toBeVisible();
    await expect(page.locator('[data-faq-answer="q-is-distilled-water"]')).toBeVisible();
  });

  test('search miss shows the no-results message', async ({ page }) => {
    await page.getByPlaceholder(/distilled water/i).fill('orchitecture');
    await expect(page.locator('[data-faq-empty]')).toBeVisible();
  });

  test('localized routes render with the seeded content', async ({ page }) => {
    for (const path of ['/es/faq', '/it/faq']) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.waitForFunction(() => document.querySelector('[data-faq-ready]') !== null, null, { timeout: 20000 });
      await expect(page.locator('[data-faq-question="q-is-distilled-water"]')).toBeVisible();
    }
  });
});
