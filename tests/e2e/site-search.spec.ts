import { test, expect } from '@playwright/test';

// Asserts only behaviour this repo controls (dialog state, focus, message copy).
// The result count depends on live Wix catalog data, so we assert the app always
// resolves to a results list or the localized empty state, never the initial hint.
test.describe('site search', () => {
  test('opens with focus on the input and closes via ESC, backdrop and button', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-search-open]').click();
    const dialog = page.locator('#site-search');
    await expect(dialog).toHaveAttribute('open', '');
    await expect(page.locator('#site-search-input')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open', '');

    await page.locator('[data-search-open]').click();
    await expect(dialog).toHaveAttribute('open', '');
    await page.locator('[data-search-close]').click();
    await expect(dialog).not.toHaveAttribute('open', '');

    await page.locator('[data-search-open]').click();
    await expect(dialog).toHaveAttribute('open', '');
    await page.mouse.click(5, page.viewportSize()!.height - 5);
    await expect(dialog).not.toHaveAttribute('open', '');
  });

  test('keeps keyboard focus inside the dialog', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-search-open]').click();

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const d = document.getElementById('site-search');
        return !!d && d.contains(document.activeElement as Node);
      });
      if (!inside) {
        const inBrowserChrome = await page.evaluate(
          () => document.activeElement === document.body || document.activeElement === null,
        );
        expect(inBrowserChrome).toBe(true);
      }
    }
  });

  test('a 2+ character query resolves to results or the empty state', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-search-open]').click();
    await page.locator('#site-search-input').fill('ne');

    const message = page.locator('[data-search-message]');
    const emptyText = await page.locator('#site-search').getAttribute('data-msg-no-results');

    await expect
      .poll(async () => {
        const text = (await message.textContent())?.trim();
        const count = await page.locator('[data-search-results] [data-result-link]').count();
        return count > 0 || text === emptyText;
      })
      .toBe(true);
  });
});
