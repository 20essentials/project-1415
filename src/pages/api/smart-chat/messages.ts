import type { APIRoute } from 'astro';
import { messages } from '@wix/ai-site-chat';
import {
  MAX_MESSAGE_LENGTH,
  toChatMessage,
  type SmartChatMessagesResponse,
} from '@/features/smart-chat/chat';
import { createSmartChatStream, readStreamError } from '@/features/smart-chat/stream';

const MAX_PAGE_SIZE = 100;

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
    return new Response(JSON.stringify({ error: 'INVALID_JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const message =
    isRecord(payload) && typeof payload.message === 'string'
      ? payload.message.trim()
      : '';

  if (!message) {
    return new Response(JSON.stringify({ error: 'MESSAGE_REQUIRED' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return new Response(JSON.stringify({ error: 'MESSAGE_TOO_LONG' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { response } = await createSmartChatStream({
      message,
      signal: request.signal,
    });

    if (!response.ok) {
      const error = await readStreamError(response);
      return new Response(JSON.stringify({ error }), {
        status: response.status >= 500 ? 502 : response.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    if (!response.body) {
      return new Response(JSON.stringify({ error: 'SMART_CHAT_STREAM_EMPTY' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
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
