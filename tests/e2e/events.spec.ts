import { test, expect } from '@playwright/test';
// Seeded Events (see .wix/seeded.json → events): Open Day (RSVP, free) and
// Guided Tour (ticketed, EUR 8). Assertions cover this repo's SSR pages and
// rendered chrome only — registration itself is covered by unit tests, since
// it writes real Wix-side data we don't control.
const OPEN_DAY = 'open-day-meet-the-predators';
const TOUR = 'guided-tour-of-the-greenhouse-1';

test.describe('events', () => {
  test('the listing shows both seeded events with their mode badges', async ({ page }) => {
    const response = await page.goto('/events');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Events');
    await expect(page.getByRole('heading', { name: 'Open Day: Meet the Predators' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guided Tour of the Greenhouse' })).toBeVisible();

    const freeCard = page.locator('a[href^="/events/open-day"]');
    await expect(freeCard.getByText('Free', { exact: true })).toBeVisible();
    const ticketCard = page.locator(`a[href^="/events/${TOUR}"]`);
    await expect(ticketCard.getByText(/Ticket/)).toBeVisible();
  });

  test('the RSVP detail page renders the registration island with its details form', async ({ page }) => {
    const response = await page.goto(`/events/${OPEN_DAY}`);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Open Day');
    const island = page.locator('form[data-testid="event-registration"]');
    await expect(island.getByText('Your details')).toBeVisible();
    await expect(island.getByRole('button', { name: /coming/ })).toBeVisible();
  });

  test('the ticketed detail page renders the sales interface', async ({ page }) => {
    const response = await page.goto(`/events/${TOUR}`);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Guided Tour');
    await expect(page.locator('form[data-testid="event-registration"]')).toBeVisible();
  });

  test('an unknown slug returns 404 with the recovery route', async ({ page }) => {
    const response = await page.goto('/events/no-such-event');
    expect(response?.status()).toBe(404);

    await expect(page.getByRole('link', { name: 'All events' })).toBeVisible();
  });

  test('events pages are localized in Spanish', async ({ page }) => {
    const response = await page.goto('/es/events');
    expect(response?.status()).toBe(200);

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { name: /Open Day: Meet the Predators/i })).toBeVisible();

    const detail = await page.goto(`/es/events/${OPEN_DAY}`);
    expect(detail?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});
