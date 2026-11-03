import type { APIRoute } from 'astro';
import { messages } from '@wix/ai-site-chat';
import {
  MAX_MESSAGE_LENGTH,
  toChatMessage,
  type SmartChatMessagesResponse,
} from '@/features/smart-chat/chat';
import { chatClientKey, InMemoryRateLimiter } from '@/features/smart-chat/rate-limits';
import { sanitizeChatMessageInput } from '@/features/smart-chat/sanitize';
import { createSmartChatStream, readStreamError } from '@/features/smart-chat/stream';

const MAX_PAGE_SIZE = 100;
const chatRateLimiter = new InMemoryRateLimiter(3, 10_000);

function jsonError(error: string, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return MAX_PAGE_SIZE;
  return Math.min(Math.floor(parsed), MAX_PAGE_SIZE);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const GET: APIRoute = async ({ url }) => {
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const limit = parseLimit(url.searchParams.get('limit'));

  try {
    const result = await messages.listMessages({
      cursorPaging: cursor ? { limit, cursor } : { limit },
    });
    const payload: SmartChatMessagesResponse = {
      messages: (result.messages ?? []).map(toChatMessage),
      nextCursor: result.pagingMetadata?.cursors?.next ?? null,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[smart-chat] list messages failed:', error);
    return new Response(JSON.stringify({ error: 'SMART_CHAT_HISTORY_UNAVAILABLE' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError('INVALID_JSON', 400);
  }

  const sanitized = sanitizeChatMessageInput(
    isRecord(payload) && typeof payload.message === 'string' ? payload.message : '',
  );

  if (!sanitized) {
    return jsonError('MESSAGE_REQUIRED', 400);
  }

  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    return jsonError('MESSAGE_TOO_LONG', 400);
  }

  const decision = chatRateLimiter.take(chatClientKey(request, request.headers.get('x-forwarded-for')));
  if (!decision.allowed) {
    return jsonError('RATE_LIMITED', 429, { 'Retry-After': String(Math.ceil(decision.retryAfterMs / 1000)) });
  }

  try {
    const { response } = await createSmartChatStream({
      message: sanitized,
      signal: request.signal,
    });

    if (!response.ok) {
      const error = await readStreamError(response);
      return jsonError(error, response.status >= 500 ? 502 : response.status);
    }

    if (!response.body) {
      return jsonError('SMART_CHAT_STREAM_EMPTY', 502);
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[smart-chat] stream failed:', error);
    return new Response(JSON.stringify({ error: 'SMART_CHAT_UNAVAILABLE' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
