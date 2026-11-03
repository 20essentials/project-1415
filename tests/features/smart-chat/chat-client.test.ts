import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isRetryableStreamFailure,
  mergeChatMessages,
  replaceDraftMessage,
  streamSmartChatMessage,
  SmartChatClientError,
} from '@/features/smart-chat/chat-client';
import type { ChatMessage } from '@/features/smart-chat/chat';

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    _id: 'message-1',
    _createdDate: '2026-11-02T10:00:00.000Z',
    sender: 'ASSISTANT',
    conversationId: null,
    answerTo: null,
    messageType: 'ANSWER',
    body: { mainText: 'Hello', footerText: null, additionalData: null },
    visitorOptions: [],
    assistantActions: [],
    visitorOptionsFields: null,
    engineStatus: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mergeChatMessages', () => {
  it('deduplicates by id and sorts chronologically', () => {
    const later = message({ _id: 'b', _createdDate: '2026-11-02T10:01:00.000Z' });
    const earlier = message({ _id: 'a', _createdDate: '2026-11-02T10:00:00.000Z' });

    expect(mergeChatMessages([later], [earlier, later])).toEqual([earlier, later]);
  });

  it('replaces a draft when the real message arrives', () => {
    const draft = message({ _id: 'draft-1', sender: 'USER', body: { mainText: 'Hi', footerText: null, additionalData: null } });
    const saved = message({ _id: 'real-1', sender: 'USER', body: { mainText: 'Hi', footerText: null, additionalData: null } });

    expect(replaceDraftMessage([draft], 'draft-1', saved)).toEqual([saved]);
  });
});

describe('streamSmartChatMessage', () => {
  it('parses fragmented NDJSON frames', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"inputMessage":{"id":"u1","sender":"UNKNOWN","messageType":"QUESTION","body":{"mainText":"Hi"}}}\n{"answerChunk":"Hel'));
        controller.enqueue(encoder.encode('lo"}\n{"answerMessage":{"id":"a1","sender":"ASSISTANT","messageType":"ANSWER","body":{"mainText":"Hello"}}}\n'));
        controller.close();
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } })),
    );

    const chunks: string[] = [];
    const input = vi.fn();
    const answer = vi.fn();

    await streamSmartChatMessage('Hi', {
      onInput: input,
      onChunk: (chunk) => chunks.push(chunk),
      onAnswer: answer,
    });

    expect(input).toHaveBeenCalledWith(expect.objectContaining({ _id: 'u1', sender: 'USER' }));
    expect(chunks).toEqual(['Hello']);
    expect(answer).toHaveBeenCalledWith(expect.objectContaining({ _id: 'a1', sender: 'ASSISTANT' }));
  });

  it('throws a client error with the API code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'MESSAGE_REQUIRED' }), { status: 400 })),
    );

    await expect(
      streamSmartChatMessage('', { onInput: vi.fn(), onChunk: vi.fn(), onAnswer: vi.fn() }),
    ).rejects.toEqual(expect.objectContaining<Partial<SmartChatClientError>>({
      code: 'MESSAGE_REQUIRED',
      status: 400,
    }));
  });

  it('retries a retryable failure and reports the attempt', async () => {
    vi.useFakeTimers();
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"answerMessage":{"id":"a1","sender":"ASSISTANT","messageType":"ANSWER","body":{"mainText":"Hello"}}}\n'));
        controller.close();
      },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'SMART_CHAT_UNAVAILABLE' }), { status: 502 }))
      .mockResolvedValueOnce(new Response(body, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } }));
    vi.stubGlobal('fetch', fetchMock);

    const answer = vi.fn();
    const onRetry = vi.fn();
    const pending = streamSmartChatMessage('Hi', {
      onInput: vi.fn(),
      onChunk: vi.fn(),
      onAnswer: answer,
      onRetry,
    });

    await vi.runAllTimersAsync();
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1);
    expect(answer).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('does not retry client failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'RATE_LIMITED' }), { status: 429 })),
    );

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    await expect(
      streamSmartChatMessage('Hi', { onInput: vi.fn(), onChunk: vi.fn(), onAnswer: vi.fn() }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('classifies retryable failures', async () => {
    expect(isRetryableStreamFailure(new SmartChatClientError('SMART_CHAT_UNAVAILABLE', 502))).toBe(true);
    expect(isRetryableStreamFailure(new SmartChatClientError('SMART_CHAT_STREAM_EMPTY', 502))).toBe(true);
    expect(isRetryableStreamFailure(new SmartChatClientError('OUT_OF_QUOTA', 400))).toBe(false);
    expect(isRetryableStreamFailure(new SmartChatClientError('RATE_LIMITED', 429))).toBe(false);
    expect(isRetryableStreamFailure(new Error('other'))).toBe(false);
    expect(isRetryableStreamFailure(null)).toBe(false);
  });
});
