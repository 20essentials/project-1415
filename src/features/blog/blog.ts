import { posts, categories } from '@wix/blog';
import { auth } from '@wix/essentials';
import { resolveWixImageUrl } from '@/shared/wix-image';
import type { RicosDocument } from '@/shared/ricos';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  hero: { url: string; width: number; height: number } | null;
  firstPublishedDate: Date | null;
  minutesToRead: number | null;
  featured: boolean;
  pinned: boolean;
  categories: string[];
  categoryIds: string[];
  language: string;
  richContent: RicosDocument | null;
}

export interface BlogCategory {
  id: string;
  label: string;
  slug: string;
  postCount: number;
}

interface PostRecord {
  _id?: string;
  title?: string;
  excerpt?: string;
  slug?: string;
  firstPublishedDate?: Date | string | null;
  minutesToRead?: number;
  featured?: boolean;
  pinned?: boolean;
  categoryIds?: string[];
  language?: string | null;
  media?: { wixMedia?: { image?: string }; displayed?: boolean; altText?: string | null } | null;
  richContent?: unknown;
}

interface CategoryRecord {
  _id?: string;
  label?: string;
  slug?: string;
  postCount?: number;
}

interface PostsQuery {
  eq(propertyName: string, value: string): PostsQuery;
  hasSome(propertyName: string, value: string[]): PostsQuery;
  limit(count: number): PostsQuery;
  find(): Promise<{ items?: PostRecord[] }>;
}

interface CategoriesQuery {
  eq(propertyName: string, value: string): CategoriesQuery;
  limit(count: number): CategoriesQuery;
  find(): Promise<{ items?: CategoryRecord[] }>;
}

// APP identity: blog reads need the site's own app token; a plain visitor token
// also works for published content, but queryPosts is declared APP-only.
const queryPostsElevated = auth.elevate(posts.queryPosts) as (
  options?: { fieldsets?: string[] },
) => PostsQuery;
const queryCategoriesElevated = auth.elevate(categories.queryCategories) as (
  options?: { fieldsets?: string[] },
) => CategoriesQuery;

const HERO_WIDTH = 1200;
const HERO_HEIGHT = 675;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPost(record: PostRecord, labelsById: Map<string, string>): BlogPost {
  const heroImage = record.media?.wixMedia?.image ?? null;
  return {
    id: record._id ?? '',
    title: record.title ?? '',
    slug: record.slug ?? '',
    excerpt: record.excerpt ?? '',
    hero: heroImage
      ? {
          url: resolveWixImageUrl(heroImage, HERO_WIDTH, HERO_HEIGHT) ?? '',
          width: HERO_WIDTH,
          height: HERO_HEIGHT,
        }
      : null,
    firstPublishedDate: toDate(record.firstPublishedDate),
    minutesToRead: typeof record.minutesToRead === 'number' ? record.minutesToRead : null,
    featured: record.featured === true,
    pinned: record.pinned === true,
    categories: (record.categoryIds ?? [])
      .map((id) => labelsById.get(id) ?? '')
      .filter((label) => label.length > 0),
    categoryIds: record.categoryIds ?? [],
    language: record.language ?? '',
    richContent: (record.richContent as RicosDocument | undefined) ?? null,
  };
}

async function categoryLabelsById(ids: string[]): Promise<Map<string, string>> {
  const labelsById = new Map<string, string>();
  if (ids.length === 0) return labelsById;
  try {
    const result = await queryCategoriesElevated().find();
    const wanted = new Set(ids);
    for (const record of result.items ?? []) {
      if (record._id && wanted.has(record._id)) {
        labelsById.set(record._id, record.label ?? '');
      }
    }
  } catch (error) {
    console.error('[blog] category labels lookup failed:', error);
  }
  return labelsById;
}

export async function listBlogPosts(limit = 50): Promise<BlogPost[]> {
  try {
    const result = await queryPostsElevated({ fieldsets: ['URL'] }).limit(limit).find();
    const records = (result.items ?? []).map((record) => ({ ...record, _id: record._id ?? '' }));
    const labelsById = await categoryLabelsById(records.flatMap((record) => record.categoryIds ?? []));
    return records.map((record) => toPost(record, labelsById)).filter((post) => post.slug.length > 0);
  } catch (error) {
    console.error('[blog] posts query failed:', error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug) return null;
  try {
    // Runtime WQL maps `slug` to blogSeo.slug, which only accepts $eq despite
    // the REST docs listing $hasSome.
    const result = await queryPostsElevated({
      fieldsets: ['URL', 'RICH_CONTENT'],
    })
      .eq('slug', slug)
      .limit(1)
      .find();
    const record = result.items?.[0];
    if (!record) return null;
    const labelsById = await categoryLabelsById(record.categoryIds ?? []);
    return toPost(record, labelsById);
  } catch (error) {
    console.error(`[blog] post lookup "${slug}" failed:`, error);
    return null;
  }
}

export async function listBlogCategories(): Promise<BlogCategory[]> {
  try {
    const result = await queryCategoriesElevated({ fieldsets: ['URL'] }).find();
    const mapped = (result.items ?? []).map((record) => ({
      id: record._id ?? '',
      label: record.label ?? '',
      slug: record.slug ?? '',
      postCount: record.postCount ?? 0,
    }));
    return mapped.filter((category) => category.label.length > 0 && category.slug.length > 0);
  } catch (error) {
    console.error('[blog] categories query failed:', error);
    return [];
  }
}

export async function getBlogCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  if (!slug) return null;
  try {
    const result = await queryCategoriesElevated().eq('slug', slug).limit(1).find();
    const record = result.items?.[0];
    return record
      ? {
          id: record._id ?? '',
          label: record.label ?? '',
          slug: record.slug ?? '',
          postCount: record.postCount ?? 0,
        }
      : null;
  } catch (error) {
    console.error(`[blog] category lookup "${slug}" failed:`, error);
    return null;
  }
}

export async function relatedPosts(
  categoryIds: string[],
  excludeId: string,
  limit = 3,
): Promise<BlogPost[]> {
  if (categoryIds.length === 0) return [];
  try {
    const result = await queryPostsElevated({ fieldsets: ['URL'] })
      .hasSome('categoryIds', categoryIds)
      .limit(limit + 10)
      .find();
    const labelsById = await categoryLabelsById(categoryIds);
    return (result.items ?? [])
      .filter((record) => record._id && record._id !== excludeId)
      .slice(0, limit)
      .map((record) => toPost(record, labelsById));
  } catch (error) {
    console.error('[blog] related posts query failed:', error);
    return [];
  }
}
