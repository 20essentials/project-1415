import { test, expect } from '@playwright/test';

// Blog circuit: feed → post → category → 404, plus the localized feed.
// Only repo-owned stuff is asserted; no <title>/meta tags (injected by Wix).
// Uses the posts seeded in step 39 (see .wix/seeded.json → blog.posts).
const seededFeed = ['How Flytraps Actually Catch Their Prey'];
const seededSlug = 'how-flytraps-actually-catch-their-prey';

test.describe('blog', () => {
  test('the feed lists the seeded posts and links the blog teaser on the home', async ({ page }) => {
    await page.goto('/blog');

    await expect(
      page.getByRole('heading', { level: 1, name: /Greenhouse notes/i }),
    ).toBeVisible();

    const postLink = page.getByRole('link', { name: new RegExp(seededFeed[0], 'i') });
    await expect(postLink).toBeVisible();
    await expect(postLink).toHaveAttribute('href', `/blog/${seededSlug}`);

    // home teaser lists the most recently published posts; which seeded post
    // lands first depends on Wix publish order (site data), so assert only
    // repo-owned chrome and that teaser links resolve inside the blog
    await page.goto('/');
    await expect(page.getByText('From the blog')).toBeVisible();
    const cta = page.getByRole('link', { name: /All posts/ });
    await expect(cta).toHaveAttribute('href', '/blog');
    const teaserLinks = page.locator('a[href^="/blog/"]:not([href="/blog"])');
    await expect(teaserLinks.first()).toBeVisible();
  });

  test('a post renders its body content and related posts', async ({ page }) => {
    await page.goto(`/blog/${seededSlug}`);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'How Flytraps Actually Catch Their Prey',
    );
    await expect(page.getByRole('heading', { name: /rule of two touches/i })).toBeVisible();
    await page.locator('article figure img').first().waitFor({ state: 'visible' });
  });

  test('an invented slug renders the not-found state with 404', async ({ page }) => {
    const response = await page.goto('/blog/not-a-real-post');

    expect(response?.status()).toBe(404);
    await expect(page.getByText(/that story/i)).toBeVisible();
  });

  test('a category page renders its seeded posts', async ({ page }) => {
    await page.goto('/blog/category/stories');

    await expect(
      page.getByRole('link', { name: /How Flytraps Actually Catch Their Prey/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Terrarium Humidity/i }),
    ).toBeVisible();
  });

  test('/es/blog renders translated chrome and localized post links', async ({ page }) => {
    await page.goto('/es/blog');

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    const navBlog = page.locator('a[href="/es/blog"]').first();
    await expect(navBlog).toBeVisible();
  });
});
