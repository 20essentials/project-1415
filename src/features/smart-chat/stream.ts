import { httpClient } from '@wix/essentials';

const PRIMARY_STREAM_URL = 'https://www.wixapis.com/wix-assistant-widget/v1/messages/stream';
const FALLBACK_STREAM_URL = 'https://www.wixapis.com/innovation/widget/v1/messages/stream';
const REQUEST_TIMEOUT_MS = 45000;

interface StreamOptions {
  message: string;
  signal?: AbortSignal;
}

export interface StreamResult {
  response: Response;
  url: string;
}

function withTimeout(timeoutMs: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('SMART_CHAT_STREAM_TIMEOUT')), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

function combineSignals(signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

export async function createSmartChatStream({ message, signal }: StreamOptions): Promise<StreamResult> {
  const timeout = withTimeout(REQUEST_TIMEOUT_MS);
  const requestSignal = combineSignals([signal, timeout.signal]);
  const elevatedFetch = httpClient.fetchWithAuth as typeof fetch;

  const body = JSON.stringify({
    message: {
      messageType: 'QUESTION',
      body: {
        mainText: message,
      },
    },
  });

  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
      'Cache-Control': 'no-store',
    },
    body,
    signal: requestSignal,
  };

  try {
    const response = await elevatedFetch(PRIMARY_STREAM_URL, init);

    if (response.status === 404 || response.status === 405) {
      const fallback = await elevatedFetch(FALLBACK_STREAM_URL, init);
      timeout.clear();
      return { response: fallback, url: FALLBACK_STREAM_URL };
    }

    timeout.clear();
    return { response, url: PRIMARY_STREAM_URL };
  } catch (error) {
    timeout.clear();
    throw error;
  }
}

export async function readStreamError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return `Smart Chat responded with ${response.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: unknown; error?: unknown; details?: { applicationError?: { description?: unknown } } };
      const message = parsed.message ?? parsed.error ?? parsed.details?.applicationError?.description;
      if (typeof message === 'string' && message) return message;
    } catch {
      return text.slice(0, 300);
    }
    return text.slice(0, 300);
  } catch {
    return `Smart Chat responded with ${response.status}`;
  }
}
