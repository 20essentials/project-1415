import { test, expect } from '@playwright/test';

// The Wix Pricing Plans app is installed on the site through the Apps Installer
// API. The monthly (€9/month) and annual (€90/year) plans back the /club page;
// if the app or plans were missing, the plans grid would fall back to
// `club.empty` and the plan-related assertions would fail.
const monthlyPlanId = 'eb5913ec-8ca8-4b8f-9dc1-1a97f6d04c07';
const annualPlanId = '32d8ce96-b019-4dd8-abf0-5263cbdcdfa4';

test.describe('club', () => {
  test('renders the pricing plans grid with both plans', async ({ page }) => {
    const response = await page.goto('/club');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1, name: 'Plant Parent Club' })).toBeVisible();
    await expect(page.getByText('Plant Parent Club — Monthly')).toBeVisible();
    await expect(page.getByText('Plant Parent Club — Annual')).toBeVisible();

    const joinButtons = page.getByRole('button', { name: 'Join the club' });
    await expect(joinButtons).toHaveCount(2);
    await expect(page.getByText('billed monthly', { exact: true })).toBeVisible();
    await expect(page.getByText('billed yearly', { exact: true })).toBeVisible();
    await expect(page.getByText('Premium care guides', { exact: true })).toBeVisible();

    await expect(page.getByText('Plans are being prepared. Check back shortly.')).toHaveCount(0);
  });

  test('shows the cancelled-checkout banner when returning with ?checkout', async ({ page }) => {
    await page.goto('/club?checkout=cancelled');
    await expect(
      page.getByText('Your membership purchase is not complete yet — you can pick up where you left off below.'),
    ).toBeVisible();
  });

  test('redirects the visitor to the checkout session URL returned by the API', async ({ page }) => {
    await page.route('**/api/club/checkout', async (route) => {
      const body = route.request().postDataJSON() as { planId?: string };
      if (body.planId !== annualPlanId) {
        await route.fulfill({ status: 500, body: 'unexpected plan in test' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ checkoutUrl: '/club?checkout=cancelled' }),
      });
    });

    await page.goto('/club');
    const checkoutPosted = page.waitForRequest(
      (request) =>
        request.url().includes('/api/club/checkout') && request.postDataJSON().planId === annualPlanId,
    );
    const annualCard = page.locator('li', { hasText: 'Plant Parent Club — Annual' });
    await annualCard.getByRole('button', { name: 'Join the club' }).click();
    await checkoutPosted;

    await page.waitForURL('**/club?checkout=cancelled');
    await expect(
      page.getByText('Your membership purchase is not complete yet — you can pick up where you left off below.'),
    ).toBeVisible();
  });

  test('invites the visitor to log in when the API answers 401', async ({ page }) => {
    await page.route('**/api/club/checkout', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'UNAUTHENTICATED' }),
      });
    });

    await page.goto('/club');
    const checkoutPosted = page.waitForResponse((response) =>
      response.url().includes('/api/club/checkout'),
    );
    await page.getByRole('button', { name: 'Join the club' }).first().click();
    await checkoutPosted;

    const invite = page.getByRole('status').filter({ hasText: 'Checkout runs with a member account —' });
    await expect(invite).toBeVisible();
    await expect(page.getByRole('link', { name: 'log in or create one' })).toHaveAttribute(
      'href',
      /\/api\/auth\/login\?returnToUrl=\/club/,
    );
  });

  test('rejects an unknown plan id through the real API', async ({ page }) => {
    await page.goto('/club');
    const response = await page.request.post('/api/club/checkout', {
      data: { planId: 'not-a-real-plan' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: 'NOT_FOUND' });
  });

  test('asks the real API for a checkout session with a valid plan id', async ({ page }) => {
    await page.goto('/club');
    const response = await page.request.post('/api/club/checkout', {
      data: { planId: monthlyPlanId },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.checkoutUrl).toMatch(/^https:\/\//);
    expect(body.checkoutUrl).toContain('plans-pricing%2Fpayment');
    expect(body.checkoutUrl).toContain(`planId%3D${monthlyPlanId}`);
    expect(body.checkoutUrl).toContain('checkout%253Dcancelled');
  });

  test('welcomes the buyer on the thank-you page', async ({ page }) => {
    const response = await page.goto('/club/welcome?planOrderId=61c60da3-f838-4e36-985f-5e606abf2fa8');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to the club' })).toBeVisible();
    await expect(page.getByText('Order reference:')).toBeVisible();
    await expect(page.getByText('61c60da3…')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View my account' })).toBeVisible();
  });

  test('locks the premium guide behind the membership paywall for visitors', async ({ page }) => {
    const response = await page.goto('/journal/humidity-for-nepenthes');
    expect(response?.status()).toBe(200);

    const gate = page.locator('.journal-gate');
    await expect(gate).toBeVisible();
    await expect(gate.getByRole('heading', { name: 'This guide is for members' })).toBeVisible();
    await expect(gate.getByRole('link', { name: 'Join the club' })).toBeVisible();

    await expect(page.locator('.journal-body')).toHaveCount(0);
  });

  test('keeps free guides open for visitors', async ({ page }) => {
    const response = await page.goto('/journal/sundew-light');
    expect(response?.status()).toBe(200);

    await expect(page.locator('.journal-body')).toBeVisible();
    await expect(page.locator('.journal-gate')).toHaveCount(0);
  });
});
