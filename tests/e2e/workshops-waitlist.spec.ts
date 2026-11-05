import { test, expect } from '@playwright/test';
// Waitlist fallback: the native Bookings Waitlist API is event-session-only
// (see step-51 Resultado), so a full appointment session simply disappears
// from availability and the join offer attaches to the "no times on this
// date" state. The day below is a future Sunday with zero bookable times,
// which is exactly the state sold-out days surface. The join POST is
// idempotent server-side, but runs share the live collection across workers,
// so the E2E asserts a positive terminal state ('success' after insert or
// 'duplicate' when the entry already exists); insert-vs-duplicate semantics
// are pinned by tests/features/workshops/waitlist.test.ts.
const EMPTY_DAY_BUTTON = '29'; // 2026-11-29, a Sunday with no sessions
const JOIN_FIRST_NAME = 'Ada';
const JOIN_EMAIL = 'waitlist-e2e@example.com';

async function openEmptyDay(page: import('@playwright/test').Page) {
  await page.goto('/services/the-repotting-bench');
  const pickDate = page.getByRole('group', { name: 'Pick a date' });
  await expect(pickDate).toBeVisible({ timeout: 30_000 });
  // The island auto-loads today's slots on mount; the note only appears after
  // hydration, so waiting on it keeps the day click from racing the island.
  await expect(page.getByText('No times available on this day', { exact: false })).toBeVisible(
    { timeout: 30_000 },
  );
  await pickDate.getByRole('button', { name: EMPTY_DAY_BUTTON, exact: true }).click();
}

test.describe('workshop waitlist', () => {
  test('a date with no times offers the waiting list and accepts a join', async ({ page }) => {
    await openEmptyDay(page);

    const card = page.getByTestId('waitlist-join');
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card.getByText('Join the waiting list for this date.')).toBeVisible();

    await card.locator('#waitlist-first-name').fill(JOIN_FIRST_NAME);
    await card.locator('#waitlist-email').fill(JOIN_EMAIL);
    await card.getByRole('button', { name: 'Join waiting list' }).click();

    const status = card.getByTestId('waitlist-status');
    await expect(status).toBeVisible({ timeout: 30_000 });
    await expect(status).toHaveAttribute('data-waitlist-state', /success|duplicate/);
  });

  test('submitting without the required fields keeps the form open', async ({ page }) => {
    await openEmptyDay(page);

    const card = page.getByTestId('waitlist-join');
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.getByRole('button', { name: 'Join waiting list' }).click();

    await expect(card.locator('#waitlist-first-name-error')).toBeVisible();
    await expect(card.locator('#waitlist-email-error')).toBeVisible();
    await expect(card.getByTestId('waitlist-status')).toHaveCount(0);
  });

  test('today has no waiting-list card even when times are unavailable', async ({ page }) => {
    await page.goto('/services/the-repotting-bench');

    const pickDate = page.getByRole('group', { name: 'Pick a date' });
    await expect(pickDate).toBeVisible({ timeout: 30_000 });
    // The island auto-loads today's slots on mount; same-day policy blocks them.
    await expect(page.getByText('No times available on this day', { exact: false })).toBeVisible(
      { timeout: 30_000 },
    );
    await expect(page.getByTestId('waitlist-join')).toHaveCount(0);
  });
});
