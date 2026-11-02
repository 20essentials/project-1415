import {
  toChatMessage,
  type ChatMessage,
  type PublicSmartChatConfig,
  type SmartChatMessagesResponse,
  type SmartChatStreamFrame,
} from './chat';
import { NdjsonParser } from './ndjson';
import type { SmartChatContactInput } from './contact';

const CONFIG_CACHE_KEY = 'pp_smart_chat_config_v1';
const CONFIG_TTL_MS = 5 * 60 * 1000;

interface CachedConfig {
  value: PublicSmartChatConfig;
  expiresAt: number;
}

export class SmartChatClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = 'SmartChatClientError';
    this.code = code;
    this.status = status;
  }
}

function readCache(): PublicSmartChatConfig | null {
  try {
    const raw = window.sessionStorage.getItem(CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedConfig;
    if (!parsed?.value || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(CONFIG_CACHE_KEY);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

function writeCache(value: PublicSmartChatConfig): void {
  try {
    window.sessionStorage.setItem(
      CONFIG_CACHE_KEY,
      JSON.stringify({ value, expiresAt: Date.now() + CONFIG_TTL_MS } satisfies CachedConfig),
    );
  } catch {
    // Storage is optional; a failed write only costs one request.
  }
}

async function readErrorCode(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === 'string') return payload.error;
  } catch {
    // Fall back to the status when the body is not JSON.
  }
  return `HTTP_${response.status}`;
}

export async function fetchSmartChatConfig(): Promise<PublicSmartChatConfig | null> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const response = await fetch('/api/smart-chat/config', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const config = (await response.json()) as PublicSmartChatConfig;
    if (!config || typeof config.enabled !== 'boolean') return null;
    writeCache(config);
    return config;
  } catch {
    return null;
  }
}

export interface SmartChatHistoryOptions {
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
}

export async function fetchSmartChatHistory(
  options: SmartChatHistoryOptions = {},
): Promise<SmartChatMessagesResponse> {
  const params = new URLSearchParams();
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.limit) params.set('limit', String(options.limit));
  const query = params.toString();

  const response = await fetch(`/api/smart-chat/messages${query ? `?${query}` : ''}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal: options.signal,
  });

  if (!response.ok) {
    throw new SmartChatClientError(await readErrorCode(response), response.status);
  }

  return (await response.json()) as SmartChatMessagesResponse;
}

export interface SmartChatStreamHandlers {
  onChunk: (chunk: string) => void;
  onInput: (message: ChatMessage) => void;
  onAnswer: (message: ChatMessage) => void;
}

function frameHandler(handlers: SmartChatStreamHandlers) {
  return (frame: SmartChatStreamFrame) => {
    if (frame.inputMessage) handlers.onInput(toChatMessage(frame.inputMessage));
    if (typeof frame.answerChunk === 'string' && frame.answerChunk) {
      handlers.onChunk(frame.answerChunk);
    }
    if (frame.answerMessage) handlers.onAnswer(toChatMessage(frame.answerMessage));
  };
}

export async function streamSmartChatMessage(
  text: string,
  handlers: SmartChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/smart-chat/messages', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text }),
    signal,
  });

  if (!response.ok) {
    throw new SmartChatClientError(await readErrorCode(response), response.status);
  }

  if (!response.body) {
    throw new SmartChatClientError('SMART_CHAT_STREAM_EMPTY', 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = new NdjsonParser<SmartChatStreamFrame>();
  const handleFrame = frameHandler(handlers);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const frames = parser.push(decoder.decode(value, { stream: true }));
      for (const frame of frames) handleFrame(frame);
    }

    for (const frame of parser.push(decoder.decode())) handleFrame(frame);
    for (const frame of parser.flush()) handleFrame(frame);
  } finally {
    reader.releaseLock();
  }
}

export async function submitSmartChatContact(input: SmartChatContactInput): Promise<void> {
  const response = await fetch('/api/smart-chat/contact', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new SmartChatClientError(await readErrorCode(response), response.status);
  }
}

function messageKey(message: ChatMessage, index: number): string {
  if (message._id) return `id:${message._id}`;
  return `draft:${message._createdDate ?? ''}:${index}`;
}

export function mergeChatMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const merged = new Map<string, ChatMessage>();

  [...current, ...incoming].forEach((message, index) => {
    const key = message._id ? `id:${message._id}` : messageKey(message, index);
    if (key.startsWith('draft:')) {
      const existingDraft = [...merged.entries()].find(
        ([existingKey]) =>
          existingKey.startsWith('draft:') &&
          merged.get(existingKey)?.body.mainText === message.body.mainText &&
          merged.get(existingKey)?.sender === message.sender,
      );
      if (existingDraft) {
        merged.set(existingDraft[0], message);
        return;
      }
    }
    merged.set(key, message);
  });

  return [...merged.values()].sort((a, b) => {
    const left = a._createdDate ? Date.parse(a._createdDate) : 0;
    const right = b._createdDate ? Date.parse(b._createdDate) : 0;
    return left - right;
  });
}

export function replaceDraftMessage(
  current: ChatMessage[],
  draftId: string,
  incoming: ChatMessage,
): ChatMessage[] {
  const withoutDraft = current.filter((message) => message._id !== draftId);
  return mergeChatMessages(withoutDraft, [incoming]);
}
