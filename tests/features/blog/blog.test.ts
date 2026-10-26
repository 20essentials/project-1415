import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RicosDocument } from '@/shared/ricos';

const { queryPosts, queryCategories, getScaledToFillImageUrl } = vi.hoisted(() => ({
  queryPosts: vi.fn(),
  queryCategories: vi.fn(),
  getScaledToFillImageUrl: vi.fn(),
}));

vi.mock('@wix/blog', () => ({
  posts: {
    queryPosts: (...args: unknown[]) => queryPosts(...args),
  },
  categories: {
    queryCategories: (...args: unknown[]) => queryCategories(...args),
  },
}));

vi.mock('@wix/essentials', () => ({
  // auth.elevate wraps the module function; identity is enough for the tests.
  auth: {
    elevate: (fn: unknown) => fn,
  },
}));

vi.mock('@wix/sdk', () => ({
  media: {
    getScaledToFillImageUrl: (...args: unknown[]) => getScaledToFillImageUrl(...args),
  },
}));

interface Chain {
  hasSome(propertyName: string, value: unknown[]): Chain;
  eq(propertyName: string, value: string): Chain;
  limit(count: number): Chain;
  find(): Promise<{ items?: Record<string, unknown>[] }>;
  state: Record<string, unknown>;
}

function chain(items: Record<string, unknown>[]): Chain {
  const state: Record<string, unknown> = {};
  const link: Chain = {
    state,
    hasSome(propertyName, value) {
      state.hasSome = [propertyName, value];
      return link;
    },
    eq(propertyName, value) {
      state.eq = [propertyName, value];
      return link;
    },
    limit() {
      return link;
    },
    find: () => Promise.resolve({ items }),
  };
  return link;
}

const ricosBody: RicosDocument = {
  nodes: [{ type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'Hello', decorations: [] } }] }],
};

const wixPost = {
  _id: 'post-1',
  title: 'Feeding schedules you can actually keep',
  slug: 'feeding-venus-flytraps',
  excerpt: 'A rhythm for summer feeding.',
  firstPublishedDate: '2026-09-30T10:00:00.000Z',
  minutesToRead: 4,
  featured: true,
  pinned: false,
  categoryIds: ['cat-1'],
  language: 'en',
  media: { wixMedia: { image: 'wix:image://v1/abc/file.jpg/abc#originWidth=3000&originHeight=2000' }, displayed: true },
  richContent: ricosBody,
};

const wixCategory = { _id: 'cat-1', label: 'Care', slug: 'care', postCount: 2 };

import {
  listBlogPosts,
  getBlogPostBySlug,
  listBlogCategories,
  getBlogCategoryBySlug,
  relatedPosts,
} from '@/features/blog/blog';

describe('blog data access', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    queryPosts.mockReset();
    queryCategories.mockReset();
    getScaledToFillImageUrl.mockReset();
    consoleError.mockRestore();
  });

  it('maps a raw post to the BlogPost DTO, resolving wix:image covers and category labels', async () => {
    queryPosts.mockReturnValue(chain([wixPost]));
    queryCategories.mockReturnValue(chain([wixCategory]));
    getScaledToFillImageUrl.mockReturnValue('https://static.wixstatic.com/media/abc/v1/fill/w_1200,h_675/abc.jpg');

    const posts = await listBlogPosts(20);

    expect(queryPosts).toHaveBeenCalledWith({ fieldsets: ['URL'] });
    expect(getScaledToFillImageUrl).toHaveBeenCalledWith(wixPost.media.wixMedia.image, 1200, 675, {});
    expect(posts).toHaveLength(1);
    const post = posts[0];
    expect(post.id).toBe('post-1');
    expect(post.slug).toBe('feeding-venus-flytraps');
    expect(post.hero).toEqual({
      url: 'https://static.wixstatic.com/media/abc/v1/fill/w_1200,h_675/abc.jpg',
      width: 1200,
      height: 675,
    });
    expect(post.firstPublishedDate).toEqual(new Date('2026-09-30T10:00:00.000Z'));
    expect(post.minutesToRead).toBe(4);
    expect(post.categories).toEqual(['Care']);
    expect(post.categoryIds).toEqual(['cat-1']);
  });

  it('returns an empty list when the posts query fails', async () => {
    queryPosts.mockReturnValue({
      limit: () => ({ find: () => Promise.reject(new Error('boom')) }),
    });

    expect(await listBlogPosts()).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
  });

  it('looks a post up by slug with eq (blogSeo.slug only allows $eq) and returns it', async () => {
    const link = chain([wixPost]);
    queryPosts.mockReturnValue(link);
    queryCategories.mockReturnValue(chain([wixCategory]));
    getScaledToFillImageUrl.mockReturnValue('https://static.wixstatic.com/media/abc/v1/fill/w_1200,h_675/abc.jpg');

    const post = await getBlogPostBySlug('feeding-venus-flytraps');

    expect(link.state.eq).toEqual(['slug', 'feeding-venus-flytraps']);
    expect(link.state.hasSome).toBeUndefined();
    expect(post?.slug).toBe('feeding-venus-flytraps');
    expect(queryPosts).toHaveBeenCalledWith({ fieldsets: ['URL', 'RICH_CONTENT'] });
  });

  it('returns null without calling the API for an empty slug', async () => {
    expect(await getBlogPostBySlug('')).toBeNull();
    expect(queryPosts).not.toHaveBeenCalled();
  });

  it('returns null when the slug has no match', async () => {
    queryPosts.mockReturnValue(chain([]));

    expect(await getBlogPostBySlug('missing')).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('lists categories with the URL fieldset', async () => {
    queryCategories.mockReturnValue(chain([{ ...wixCategory }, { _id: 'cat-2', label: 'Blooms', slug: 'blooms' }]));

    const categories = await listBlogCategories();

    expect(queryCategories).toHaveBeenCalledWith({ fieldsets: ['URL'] });
    expect(categories.map((category) => category.slug)).toEqual(['care', 'blooms']);
    expect(categories[0].postCount).toBe(2);
  });

  it('returns an empty list when the categories query fails', async () => {
    queryCategories.mockReturnValue({
      find: () => Promise.reject(new Error('boom')),
    });

    expect(await listBlogCategories()).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
  });

  it('looks a category up by slug with eq (categories allow it)', async () => {
    const link = chain([wixCategory]);
    queryCategories.mockReturnValue(link);

    const category = await getBlogCategoryBySlug('care');

    expect(link.state.eq).toEqual(['slug', 'care']);
    expect(category?.label).toBe('Care');
  });

  it('returns related posts excluding the current one', async () => {
    const excludePost = { ...wixPost, _id: 'other-post' };
    queryPosts.mockReturnValue(chain([{ ...wixPost, _id: 'related-1' }, excludePost, { ...wixPost, _id: 'related-2' }]));

    const related = await relatedPosts(['cat-1'], 'other-post', 3);

    const link = queryPosts.mock.results[0].value as Chain;
    expect(link.state.hasSome).toEqual(['categoryIds', ['cat-1']]);
    expect(related.map((post) => post.id)).toEqual(['related-1', 'related-2']);
    expect(related).toHaveLength(2);
  });

  it('returns an empty list when no category ids are provided', async () => {
    expect(await relatedPosts([], 'post-1')).toEqual([]);
    expect(queryPosts).not.toHaveBeenCalled();
  });
});
