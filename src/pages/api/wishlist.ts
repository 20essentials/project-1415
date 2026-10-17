import type { APIRoute } from 'astro';
import { members } from '@wix/members';
import {
  addToWishlist,
  listWishlist,
  removeFromWishlist,
} from '@/features/wishlist/wishlist';

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function currentMemberId(): Promise<string | null> {
  try {
    const res = await members.getCurrentMember({ fieldsets: ['FULL'] });
    return res.member?._id ?? null;
  } catch {
    return null;
  }
}

export const GET: APIRoute = async () => {
  const memberId = await currentMemberId();
  if (!memberId) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  try {
    const items = await listWishlist(memberId);
    return json({ items }, 200);
  } catch (error) {
    console.error('[wishlist-api] list failed:', error);
    return json({ error: 'FAILED' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  const payload = (body ?? {}) as { productId?: unknown; slug?: unknown };
  const productId = typeof payload.productId === 'string' ? payload.productId.trim() : '';
  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : undefined;

  if (!productId) return json({ error: 'INVALID_INPUT' }, 400);

  const memberId = await currentMemberId();
  if (!memberId) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  try {
    await addToWishlist(memberId, { productId, slug });
    return json({ wished: true }, 200);
  } catch (error) {
    console.error('[wishlist-api] add failed:', error);
    return json({ error: 'FAILED' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const productId = new URL(request.url).searchParams.get('productId')?.trim() ?? '';
  if (!productId) return json({ error: 'INVALID_INPUT' }, 400);

  const memberId = await currentMemberId();
  if (!memberId) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  try {
    await removeFromWishlist(memberId, productId);
    return json({ wished: false }, 200);
  } catch (error) {
    console.error('[wishlist-api] remove failed:', error);
    return json({ error: 'FAILED' }, 500);
  }
};
