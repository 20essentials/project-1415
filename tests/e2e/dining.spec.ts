import { test, expect, type Route } from '@playwright/test';
// The Jungle Tasting menu is seeded via the Menus app (see .wix/seeded.json →
// restaurants) and read live by getJungleMenu() with auth.elevate. Seatings are
// projected from the experience's own businessSchedule. The assertions check
// this repo's app behavior — SSR of the seeded card, island states, i18n —
// not Wix-side capacity or online-payment configuration.

test.describe('/dining', () => {
  test('serves the Jungle Tasting menu with seeded sections, prices and the reservation island', async ({ page }) => {
    await page.goto('/dining');
    await expect(page.getByRole('heading', { name: 'Jungle Tasting.', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Jungle Tasting', level: 2 })).toBeVisible();

    const items = page.getByTestId('dining-menu-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(10);
    await expect(items.first()).toContainText('€');

    await expect(page.getByTestId('dining-next')).toBeVisible();
    const submit = page.getByRole('button', { name: 'Reserve my table' });
    await expect(submit).toBeDisabled();
    await expect(async () => {
      await page.getByRole('group', { name: 'Pick a seating' }).locator('button').first().click();
      await expect(submit).toBeEnabled();
    }).toPass({ timeout: 10_000 });
  });

  test('shows the 409 copy when Wix has no seatings left for the requested time', async ({ page }) => {
    await page.route(
      '**/api/dining/reservations',
      (route: Route) =>
        route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'NO_AVAILABILITY' }) }),
    );
    await page.goto('/dining');
    const group = page.getByRole('group', { name: 'Pick a seating' });
    await expect(
      async () => {
        await group.locator('button').first().click();
        await expect(page.getByRole('button', { name: 'Reserve my table' })).toBeEnabled();
      },
    ).toPass({ timeout: 10_000 });
    await page.locator('#firstName').fill('Ada');
    await page.locator('#phone').fill('+34 600 000 000');
    await page.locator('#email').fill('ada@example.com');
    await page.getByRole('button', { name: 'Reserve my table' }).click();
    await expect(page.getByRole('alert')).toContainText('Next date TBA');
  });

  test('shows the localised surface at /es/dining', async ({ page }) => {
    await page.goto('/es/dining');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('button', { name: 'Reservar mi mesa' })).toBeDisabled();
    await expect(
      async () => {
        await page.getByRole('group', { name: 'Elige un turno' }).locator('button').first().click();
        await expect(page.getByRole('button', { name: 'Reservar mi mesa' })).toBeEnabled();
      },
    ).toPass({ timeout: 10_000 });
  });
});
