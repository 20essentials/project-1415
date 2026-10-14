import { reviews } from '@wix/reviews';
import { auth } from '@wix/essentials';

export interface ReviewAuthor {
  contactId: string | null;
  authorName: string | null;
}

export interface ReviewContent {
  title: string | null;
  body: string | null;
  rating: number;
}

export interface ProductReview {
  id: string;
  entityId: string;
  author: ReviewAuthor;
  content: ReviewContent;
  createdDate: Date | null;
  verified: boolean;
}

interface ReviewRecord {
  _id?: string;
  entityId?: string;
  author?: { contactId?: string | null; authorName?: string | null };
  content?: { title?: string | null; body?: string | null; rating?: number };
  _createdDate?: Date | string | null;
  verified?: boolean;
}

interface ReviewSort {
  fieldName?: string;
  order?: 'ASC' | 'DESC';
}

interface ReviewQuery {
  filter?: Record<string, unknown>;
  sort?: ReviewSort[];
  cursorPaging?: { limit?: number };
}

interface ReviewsQueryResult {
  reviews?: ReviewRecord[];
}

type QueryReviews = (query?: ReviewQuery) => Promise<ReviewsQueryResult>;

const queryReviewsElevated = auth.elevate(reviews.queryReviews) as QueryReviews;

const STORES_NAMESPACE = 'stores';
const PRODUCT_REVIEW_LIMIT = 10;
const FEATURED_FETCH_LIMIT = 50;
const FEATURED_LIMIT = 6;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toReview(record: ReviewRecord): ProductReview {
  return {
    id: record._id ?? '',
    entityId: record.entityId ?? '',
    author: {
      contactId: record.author?.contactId ?? null,
      authorName: record.author?.authorName ?? null,
    },
    content: {
      title: record.content?.title ?? null,
      body: record.content?.body ?? null,
      rating: record.content?.rating ?? 0,
    },
    createdDate: toDate(record._createdDate),
    verified: record.verified ?? false,
  };
}

export function averageRating(list: ProductReview[]): number {
  if (list.length === 0) return 0;
  const total = list.reduce((sum, review) => sum + review.content.rating, 0);
  return total / list.length;
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  if (!productId) return [];
  try {
    const result = await queryReviewsElevated({
      filter: { namespace: STORES_NAMESPACE, entityId: productId },
      sort: [{ fieldName: 'createdDate', order: 'DESC' }],
      cursorPaging: { limit: PRODUCT_REVIEW_LIMIT },
    });
    return (result.reviews ?? []).map(toReview).filter((review) => review.id.length > 0);
  } catch (error) {
    console.error('[reviews] product reviews query failed:', error);
    return [];
  }
}

export async function getFeaturedReviews(): Promise<ProductReview[]> {
  try {
    const result = await queryReviewsElevated({
      filter: { namespace: STORES_NAMESPACE },
      sort: [{ fieldName: 'createdDate', order: 'DESC' }],
      cursorPaging: { limit: FEATURED_FETCH_LIMIT },
    });
    return (result.reviews ?? [])
      .map(toReview)
      .filter((review) => review.id.length > 0)
      .sort((a, b) => {
        if (b.content.rating !== a.content.rating) return b.content.rating - a.content.rating;
        const aTime = a.createdDate?.getTime() ?? 0;
        const bTime = b.createdDate?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, FEATURED_LIMIT);
  } catch (error) {
    console.error('[reviews] featured reviews query failed:', error);
    return [];
  }
}
