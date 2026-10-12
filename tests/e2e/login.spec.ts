import { test, expect } from '@playwright/test';

test.describe('member login', () => {
  test('header "Log in" starts the Wix OAuth flow instead of erroring', async ({ page }) => {
    await page.goto('/');

    const loginLink = page.getByRole('link', { name: 'Log in' }).first();
    await expect(loginLink).toHaveAttribute('href', /\/api\/auth\/login\?returnToUrl=/);

    await Promise.all([
      page.waitForURL(/wix-site-host\.com\/.*(?:__auth|_api\/oauth2)/),
      loginLink.click(),
    ]);
  });

  test('visiting /account lands on the Wix login page', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/wix-site-host\.com\/.*(?:__auth|_api\/oauth2)/);
  });

  test('/account redirect chain preserves returnToUrl and never 500s', async ({ request }) => {
    const first = await request.get('/account', { maxRedirects: 0 });
    expect(first.status()).toBe(302);
    const loginUrl = first.headers()['location'];
    expect(loginUrl).toMatch(/\/api\/auth\/login\?returnToUrl=\/account$/);

    const second = await request.get(loginUrl, { maxRedirects: 0 });
    expect(second.status()).toBe(302);
    expect(second.headers()['location']).toContain('/_api/oauth2/authorize');
  });
});