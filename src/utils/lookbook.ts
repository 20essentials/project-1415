import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { resolveWixImageUrl } from '@/utils/wix-image';
import type { RicosDocument } from '@/utils/ricos';

export interface LookbookEntry {
  id: string;
  season: string;
  title: string;
  tagline: string;
  story: RicosDocument | string | null;
  hero: string | null;
  gallery: string[];
  productSlugs: string[];
  orderIndex: number;
}

interface LookbookRecord {
  _id?: string;
  season?: string;
  title?: string;
  tagline?: string;
  story?: unknown;
  heroImage?: string;
  gallery?: string[];
  productSlugs?: string[];
  orderIndex?: number;
}

interface LookbookQuery {
  ascending(field: string): LookbookQuery;
  limit(count: number): LookbookQuery;
  find(): Promise<{ items?: LookbookRecord[] }>;
}

const COLLECTION = 'lookbook';
const queryLookbookElevated = auth.elevate(items.query) as (collectionId: string) => LookbookQuery;

function toEntry(record: LookbookRecord): LookbookEntry {
  const gallery = Array.isArray(record.gallery) ? record.gallery : [];
  return {
    id: record._id ?? '',
    season: record.season ?? '',
    title: record.title ?? '',
    tagline: record.tagline ?? '',
    story: (record.story as RicosDocument | string | undefined) ?? null,
    hero: resolveWixImageUrl(record.heroImage, 1920, 1080),
    gallery: gallery
      .map((image) => resolveWixImageUrl(image, 900, 1125))
      .filter((url): url is string => Boolean(url)),
    productSlugs: Array.isArray(record.productSlugs) ? record.productSlugs : [],
    orderIndex: typeof record.orderIndex === 'number' ? record.orderIndex : 0,
  };
}

export async function queryLookbook(): Promise<LookbookEntry[]> {
  try {
    const result = await queryLookbookElevated(COLLECTION).ascending('orderIndex').limit(50).find();
    return (result.items ?? [])
      .map(toEntry)
      .filter((entry) => entry.title.length > 0 || entry.season.length > 0);
  } catch (error) {
    console.error('[lookbook] query failed:', error);
    return [];
  }
}
