import { posts, categories } from '@wix/blog';
import { auth } from '@wix/essentials';
import { resolveWixImageUrl } from '@/shared/wix-image';
import type { RicosDocument } from '@/shared/ricos';
import { PRIMARY_LOCALE } from '@/shared/i18n';

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
  /** Published comment count (Wix Blog metrics); null when metrics were not requested. */
  commentCount: number | null;
}

export interface BlogCategory {
  id: string;
  label: string;
  slug: string;
  postCount: number;
}

interface PostMediaImage {
  id?: string | null;
  url?: string;
  width?: number;
  height?: number;
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
  media?: { wixMedia?: { image?: string | PostMediaImage }; displayed?: boolean; altText?: string | null } | null;
  richContent?: unknown;
  metrics?: { comments?: number | null } | null;
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

// Fill-only scale, never crop: matching the fill URL's height to the natural
// ratio (the transform returns "missing h" when height is absent).
function resolveHero(image: string | PostMediaImage | null | undefined): BlogPost['hero'] {
  if (image == null) return null;
  const natural = naturalDimensions(image);
  if (!natural) return null;

  const raw = typeof image === 'object' ? image.url : image;
  if (typeof raw !== 'string') return null;

  if (natural.width <= HERO_WIDTH) {
    const url = resolveWixImageUrl(raw);
    return url ? { url, width: natural.width, height: natural.height } : null;
  }
  const height = Math.round((natural.height * HERO_WIDTH) / natural.width);
  const url = resolveWixImageUrl(raw, HERO_WIDTH, height);
  return url ? { url, width: HERO_WIDTH, height } : null;
}

function naturalDimensions(image: string | PostMediaImage | null | undefined): { width: number; height: number } | null {
  if (!image) return null;
  if (typeof image === 'object') {
    const { width, height } = image;
    if (typeof width === 'number' && width > 0 && typeof height === 'number' && height > 0) {
      return { width, height };
    }
    if (typeof image.url === 'string') return naturalDimensions(image.url);
    return null;
  }
  const hash = image.indexOf('#');
  if (hash === -1) return null;
  const hasProbe = new URLSearchParams(image.slice(hash + 1));
  const width = Number(hasProbe.get('originWidth'));
  const height = Number(hasProbe.get('originHeight'));
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }
  return null;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPost(record: PostRecord, labelsById: Map<string, string>): BlogPost {
  return {
    id: record._id ?? '',
    title: record.title ?? '',
    slug: record.slug ?? '',
    excerpt: record.excerpt ?? '',
    hero: resolveHero(record.media?.wixMedia?.image ?? null),
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
    commentCount: typeof record.metrics?.comments === 'number' ? record.metrics.comments : null,
  };
}

async function categoryLabelsById(ids: string[], language: string): Promise<Map<string, string>> {
  const labelsById = new Map<string, string>();
  if (ids.length === 0) return labelsById;
  try {
    const result = await queryCategoriesElevated().eq('language', language).find();
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

export async function listBlogPosts(limit = 50, language: string = PRIMARY_LOCALE): Promise<BlogPost[]> {
  try {
    const result = await queryPostsElevated({ fieldsets: ['URL', 'METRICS'] })
      .eq('language', language)
      .limit(limit)
      .find();
    const records = (result.items ?? []).map((record) => ({ ...record, _id: record._id ?? '' }));
    const labelsById = await categoryLabelsById(records.flatMap((record) => record.categoryIds ?? []), language);
    return records.map((record) => toPost(record, labelsById)).filter((post) => post.slug.length > 0);
  } catch (error) {
    console.error('[blog] posts query failed:', error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string, language: string = PRIMARY_LOCALE): Promise<BlogPost | null> {
  if (!slug) return null;
  try {
    // Runtime WQL maps `slug` to blogSeo.slug, which only accepts $eq despite
    // the REST docs listing $hasSome.
    const result = await queryPostsElevated({
      fieldsets: ['URL', 'RICH_CONTENT'],
    })
      .eq('slug', slug)
      .eq('language', language)
      .limit(1)
      .find();
    const record = result.items?.[0];
    if (!record) return null;
    const labelsById = await categoryLabelsById(record.categoryIds ?? [], language);
    return toPost(record, labelsById);
  } catch (error) {
    console.error(`[blog] post lookup "${slug}" failed:`, error);
    return null;
  }
}

export async function listBlogCategories(language: string = PRIMARY_LOCALE): Promise<BlogCategory[]> {
  try {
    const result = await queryCategoriesElevated({ fieldsets: ['URL'] }).eq('language', language).find();
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

export async function getBlogCategoryBySlug(slug: string, language: string = PRIMARY_LOCALE): Promise<BlogCategory | null> {
  if (!slug) return null;
  try {
    const result = await queryCategoriesElevated({
      fieldsets: ['URL'],
    })
      .eq('slug', slug)
      .eq('language', language)
      .limit(1)
      .find();
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
  language: string = PRIMARY_LOCALE,
): Promise<BlogPost[]> {
  if (categoryIds.length === 0) return [];
  try {
    const result = await queryPostsElevated({ fieldsets: ['URL'] })
      .hasSome('categoryIds', categoryIds)
      .eq('language', language)
      .limit(limit + 10)
      .find();
    const labelsById = await categoryLabelsById(categoryIds, language);
    return (result.items ?? [])
      .filter((record) => record._id && record._id !== excludeId)
      .slice(0, limit)
      .map((record) => toPost(record, labelsById));
  } catch (error) {
    console.error('[blog] related posts query failed:', error);
    return [];
  }
}
