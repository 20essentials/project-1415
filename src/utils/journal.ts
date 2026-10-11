import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { resolveWixImageUrl } from '@/utils/wix-image';
import type { RicosDocument } from '@/utils/ricos';

export interface CareGuide {
  id: string;
  title: string;
  slug: string;
  intro: string;
  tag: string;
  cover: string | null;
  body: RicosDocument | string | null;
  createdDate: Date | null;
}

interface GuideRecord {
  _id?: string;
  title?: string;
  slug?: string;
  intro?: string;
  plantTag?: string;
  coverImage?: string;
  body?: unknown;
  _createdDate?: Date | string;
}

interface GuideQuery {
  descending(field: string): GuideQuery;
  eq(field: string, value: string): GuideQuery;
  limit(count: number): GuideQuery;
  find(): Promise<{ items?: GuideRecord[] }>;
}

const COLLECTION = 'care-guides';
const queryGuidesElevated = auth.elevate(items.query) as (collectionId: string) => GuideQuery;

function toDate(value: Date | string | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toGuide(record: GuideRecord): CareGuide {
  return {
    id: record._id ?? '',
    title: record.title ?? '',
    slug: record.slug ?? '',
    intro: record.intro ?? '',
    tag: record.plantTag ?? '',
    cover: resolveWixImageUrl(record.coverImage, 900, 1125),
    body: (record.body as RicosDocument | string | undefined) ?? null,
    createdDate: toDate(record._createdDate),
  };
}

export async function queryGuides(): Promise<CareGuide[]> {
  try {
    const result = await queryGuidesElevated(COLLECTION).descending('_createdDate').limit(50).find();
    return (result.items ?? []).map(toGuide).filter((guide) => guide.slug.length > 0);
  } catch (error) {
    console.error('[journal] guides query failed:', error);
    return [];
  }
}

export async function getGuideBySlug(slug: string): Promise<CareGuide | null> {
  if (!slug) return null;
  try {
    const result = await queryGuidesElevated(COLLECTION).eq('slug', slug).limit(1).find();
    const record = result.items?.[0];
    return record ? toGuide(record) : null;
  } catch (error) {
    console.error('[journal] guide lookup failed:', error);
    return null;
  }
}
