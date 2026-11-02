import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSmartChatStream, readStreamError } from '@/features/smart-chat/stream';

const PRIMARY = 'https://www.wixapis.com/wix-assistant-widget/v1/messages/stream';
const FALLBACK = 'https://www.wixapis.com/innovation/widget/v1/messages/stream';

function mockFetch(...responses: Response[]) {
  let index = 0;
  const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
    const response = responses[index];
    index += 1;
    return response ?? new Response('', { status: 500 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createSmartChatStream', () => {
  it('posts the question to the primary endpoint', async () => {
    const fetchMock = mockFetch(new Response('{"answerChunk":"ok"}', { status: 200 }));

    const result = await createSmartChatStream({ message: 'Hello' });

    expect(result.url).toBe(PRIMARY);
    expect(result.response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(PRIMARY);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Accept: 'application/x-ndjson',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init.body))).toEqual({
      message: {
        messageType: 'QUESTION',
        body: { mainText: 'Hello' },
      },
    });
  });

  it('falls back to the innovation path on 404', async () => {
    const fetchMock = mockFetch(
      new Response('', { status: 404 }),
      new Response('{"answerChunk":"ok"}', { status: 200 }),
    );

    const result = await createSmartChatStream({ message: 'Hello' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(PRIMARY);
    expect(fetchMock.mock.calls[1][0]).toBe(FALLBACK);
    expect(result.url).toBe(FALLBACK);
  });

  it('returns upstream errors without retrying', async () => {
    const fetchMock = mockFetch(new Response('{"message":"Nope"}', { status: 500 }));

    const result = await createSmartChatStream({ message: 'Hello' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.url).toBe(PRIMARY);
    expect(result.response.status).toBe(500);
  });
});

describe('readStreamError', () => {
  it('reads a JSON error message', async () => {
    const message = await readStreamError(
      new Response(JSON.stringify({ message: 'Invalid identity' }), { status: 400 }),
    );

    expect(message).toBe('Invalid identity');
  });

  it('falls back to the response text or status', async () => {
    expect(await readStreamError(new Response('plain error', { status: 400 }))).toBe(
      'plain error',
    );
    expect(await readStreamError(new Response('', { status: 500 }))).toBe(
      'Smart Chat responded with 500',
    );
  });
});
