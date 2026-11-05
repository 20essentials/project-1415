import { test, expect } from '@playwright/test';

// Blog comments circuit: SSR list + feed counter + guest sign-in CTA + 404.
// Only repo-owned stuff is asserted; no <title>/meta (injected by Wix).
// Uses the comment seeded in step 50 (see .wix/seeded.json → blog.comments).
const seededSlug = 'how-flytraps-actually-catch-their-prey';
const seededCommentText = 'The two-touch feeding rule finally clicked for me';

test.describe('blog comments', () => {
  test('a post renders the comments section with the seeded comment', async ({ page }) => {
    await page.goto(`/blog/${seededSlug}`);

    const section = page.locator('section#comments');
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { name: 'Comments' })).toBeVisible();
    await expect(section.getByText(/1 comment/)).toBeVisible();
    await expect(section.getByText(seededCommentText)).toBeVisible();
  });

  test('a guest sees the sign-in invitation instead of the comment form', async ({ page }) => {
    await page.goto(`/blog/${seededSlug}`);

    const signIn = page.getByTestId('comments-sign-in');
    await expect(signIn).toBeVisible();
    await expect(signIn.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      `/api/auth/login?returnToUrl=/blog/${seededSlug}`,
    );
    expect(await page.locator('#comment-text').count()).toBe(0);
  });

  test('the feed shows the comment count next to the seeded post meta', async ({ page }) => {
    await page.goto('/blog');

    const card = page.locator('a', { hasText: 'How Flytraps Actually Catch Their Prey' }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText(/1 comment/)).toBeVisible();
  });

  test('a post without comments shows the empty state', async ({ page }) => {
    await page.goto('/blog/repotting-carnivorous-plants-without-killing-them');

    const section = page.locator('section#comments');
    await expect(section.getByRole('heading', { name: 'Comments' })).toBeVisible();
    await expect(section.getByText(/0 comments/)).toBeVisible();
    await expect(section.getByText(/No clones yet/)).toBeVisible();
  });

  test('an invented slug renders 404 without a comments section', async ({ page }) => {
    const response = await page.goto('/blog/not-a-real-comment-thread');

    expect(response?.status()).toBe(404);
    expect(await page.locator('section#comments').count()).toBe(0);
  });

  test('/es/blog localizes the comments chrome on the post page', async ({ page }) => {
    // The ES variant has its own slug (see .wix/seeded.json → blog.postTranslations)
    await page.goto('/es/blog/como-cazan-de-verdad-las-trampas-de-venus');

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('section#comments').getByRole('heading', { name: 'Comentarios' })).toBeVisible();
  });
});
