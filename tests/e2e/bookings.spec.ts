import { test, expect, type Page, type Route } from '@playwright/test';

// Seeded Bookings service (see .wix/seeded.json → bookings.services: Care 101);
// live slot availability in the dev site is empty, so every flow stubs
// /api/slots and /api/bookings. The assertions check this repo's app behavior,
// not Wix-side session data or online-payment configuration.
const SEED_SLOT = { localStartDate: '2030-01-01T10:00:00', localEndDate: '2030-01-01T11:00:00' };
const BOOKING_BODY = (id: string, status: string) =>
  JSON.stringify({
    booking: {
      id,
      status,
      slug: 'care-101',
      serviceName: 'Care 101',
      localStartDate: SEED_SLOT.localStartDate,
      localEndDate: SEED_SLOT.localEndDate,
    },
  });

async function stubSlots(page: Page) {
  await page.route('**/api/slots*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ slots: [SEED_SLOT] }),
    }),
  );
}

async function openBookingForm(page: Page, respondBookings: (route: Route) => unknown) {
  await stubSlots(page);
  await page.route('**/api/bookings', respondBookings);

  await page.goto('/services/care-101');
  const timeButtons = page.getByRole('group', { name: 'Pick a time' }).locator('button');
  await expect(timeButtons).toHaveCount(1, { timeout: 15_000 });
  await timeButtons.first().click();

  await page.locator('#first_name').fill('Ada');
  await page.locator('#last_name').fill('Green');
  await page.locator('#email').fill('ada@example.com');
}

test.describe('workshop booking checkout', () => {
  test('the service page shows the booking island and per-mode payment copy', async ({ page }) => {
    const response = await page.goto('/services/care-101');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('group', { name: 'Pick a date' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your details' })).toBeHidden();

    await stubSlots(page);
    await expect(page.getByRole('group', { name: 'Pick a time' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('group', { name: 'Pick a time' }).locator('button').first().click();
    await expect(page.getByRole('button', { name: 'Book & pay' })).toBeVisible();
  });

  test('returning from an abandoned checkout shows the not-reserved banner', async ({ page }) => {
    const response = await page.goto('/services/care-101?booking=cancelled');
    expect(response?.status()).toBe(200);

    const banner = page.getByRole('status').filter({ hasText: "Your spot isn't reserved yet" });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('link', { name: 'Try booking again' })).toBeVisible();
  });

  test('submitting the form online redirects to the hosted checkout', async ({ page }) => {
    await openBookingForm(page, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          booking: JSON.parse(BOOKING_BODY('e2e-booking-1', 'PENDING')),
          checkoutUrl: 'https://www.wix.com/checkout/bookings/e2e-session',
        }),
      }),
    );

    const redirect = page.waitForURL('**/checkout/bookings/**');
    await page.getByRole('button', { name: 'Book & pay' }).click();
    await redirect;
  });

  test('a booking without checkoutUrl lands on the receipt and leaks no PII', async ({ page }) => {
    let payment: string | undefined;
    await openBookingForm(page, (route) => {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      payment = typeof payload.payment === 'string' ? payload.payment : undefined;
      return route.fulfill({ status: 200, contentType: 'application/json', body: BOOKING_BODY('e2e-booking-2', 'CONFIRMED') });
    });

    const redirect = page.waitForURL('**/booking-confirmation?*');
    await page.getByRole('button', { name: 'Book & pay' }).click();
    expect(payment).toBe('online');
    await redirect;

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/[A-Za-z]/);
    await expect(page.locator('body')).not.toContainText('ada@example.com');
  });

  test('an unavailable checkout session falls back to the on-site flow', async ({ page }) => {
    let payment: string | undefined;
    let call = 0;
    await openBookingForm(page, (route) => {
      call += 1;
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      payment = typeof payload.payment === 'string' ? payload.payment : undefined;
      if (call === 1) {
        return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'CHECKOUT_UNAVAILABLE' }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: BOOKING_BODY('e2e-booking-3', 'CONFIRMED') });
    });

    await page.getByRole('button', { name: 'Book & pay' }).click();

    const notice = page.getByRole('status').filter({ hasText: /Online checkout isn.t available right now/ });
    await expect(notice).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reserve (pay on site)' })).toBeVisible();

    const redirect = page.waitForURL('**/booking-confirmation?*');
    await page.getByRole('button', { name: 'Reserve (pay on site)' }).click();
    expect(payment).toBe('offline');
    await redirect;

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/[A-Za-z]/);
  });
});
