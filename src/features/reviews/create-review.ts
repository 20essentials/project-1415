import { reviews } from '@wix/reviews';
import { auth } from '@wix/essentials';
import type { Member } from '@wix/auto_sdk_members_members';

export interface ReviewInput {
  productId: string;
  rating: number;
  title?: string;
  body: string;
}

export interface CreatedReview {
  id: string;
  moderationStatus: string | null;
}

export type ReviewSubmitCode = 'INVALID_INPUT' | 'NOT_AUTHENTICATED' | 'FAILED';

export class ReviewSubmitError extends Error {
  constructor(
    public readonly code: ReviewSubmitCode,
    message: string,
  ) {
    super(message);
    this.name = 'ReviewSubmitError';
  }
}

const STORES_NAMESPACE = 'stores';

function isPermissionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { status?: number; details?: { applicationError?: { code?: unknown } } };
  if (e.status === 403) return true;
  const code = typeof e.details?.applicationError?.code === 'string' ? e.details.applicationError.code : '';
  const message = error instanceof Error ? error.message : '';
  return /permission|forbidden|not[_ ]?allowed|scope/i.test(`${code} ${message}`);
}

export async function submitProductReview(
  input: ReviewInput,
  member: Member | null,
): Promise<CreatedReview> {
  if (
    !input.productId.trim() ||
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5
  ) {
    throw new ReviewSubmitError('INVALID_INPUT', 'Invalid product id or rating');
  }

  const contactId = member?.contactId;
  if (!contactId) {
    throw new ReviewSubmitError('NOT_AUTHENTICATED', 'Member has no contact id');
  }

  const review = {
    namespace: STORES_NAMESPACE,
    entityId: input.productId,
    author: { contactId },
    content: {
      rating: input.rating,
      title: input.title?.trim() || undefined,
      body: input.body.trim(),
    },
  };

  try {
    const created = await reviews.createReview(review);
    return {
      id: created._id ?? '',
      moderationStatus: created.moderation?.moderationStatus ?? null,
    };
  } catch (error) {
    if (isPermissionError(error)) {
      try {
        const created = await auth.elevate(reviews.createReview)(review);
        return {
          id: created._id ?? '',
          moderationStatus: created.moderation?.moderationStatus ?? null,
        };
      } catch (elevatedError) {
        console.error('[reviews] createReview (elevated) failed:', elevatedError);
        throw new ReviewSubmitError('FAILED', 'Review creation failed');
      }
    }
    console.error('[reviews] createReview failed:', error);
    throw new ReviewSubmitError('FAILED', 'Review creation failed');
  }
}
