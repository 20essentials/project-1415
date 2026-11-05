import type { APIRoute } from 'astro';
import { members } from '@wix/members';
import { CommentSubmitError, createPostComment } from '@/features/comments/comments';

const COMMENT_MAX = 1000;

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
    postId?: unknown;
    text?: unknown;
  };

  const postId = typeof payload.postId === 'string' ? payload.postId.trim() : '';
  const text = typeof payload.text === 'string' ? payload.text.trim() : '';

  if (!postId || !text || text.length > COMMENT_MAX) {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  let memberId = '';
  try {
    const res = await members.getCurrentMember();
    memberId = res.member?._id ?? '';
  } catch {
    memberId = '';
  }

  if (!memberId) {
    return json({ error: 'NOT_AUTHENTICATED' }, 401);
  }

  try {
    const comment = await createPostComment(postId, text, memberId);
    return json({ comment }, 201);
  } catch (error) {
    if (error instanceof CommentSubmitError) {
      return json({ error: error.code }, ERROR_STATUS[error.code] ?? 500);
    }
    console.error('[comments-api] comment creation failed:', error);
    return json({ error: 'INTERNAL' }, 500);
  }
};
