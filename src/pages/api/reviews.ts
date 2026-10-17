import type { APIRoute } from 'astro';
import { members } from '@wix/members';
import { ReviewSubmitError, submitProductReview } from '@/features/reviews/create-review';

const TITLE_MAX = 100;
const BODY_MAX = 2000;

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const ERROR_STATUS: Record<string, number> = {
  INVALID_INPUT: 400,
  NOT_AUTHENTICATED: 401,
  FAILED: 500,
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  const payload = (body ?? {}) as {
    productId?: unknown;
    rating?: unknown;
    title?: unknown;
    body?: unknown;
  };

  const productId = typeof payload.productId === 'string' ? payload.productId.trim() : '';
  const rating = payload.rating;
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const text = typeof payload.body === 'string' ? payload.body.trim() : '';

  if (
    !productId ||
    typeof rating !== 'number' ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    !text ||
    text.length > BODY_MAX ||
    title.length > TITLE_MAX
  ) {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  let member = null;
  try {
    const res = await members.getCurrentMember({ fieldsets: ['FULL'] });
    member = res.member ?? null;
  } catch {
    member = null;
  }

  try {
    const review = await submitProductReview(
      { productId, rating, title: title || undefined, body: text },
      member,
    );
    return json({ review }, 201);
  } catch (error) {
    if (error instanceof ReviewSubmitError) {
      return json({ error: error.code }, ERROR_STATUS[error.code] ?? 500);
    }
    console.error('[reviews-api] review creation failed:', error);
    return json({ error: 'INTERNAL' }, 500);
  }
};
