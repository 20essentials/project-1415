// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  fetchConfig: vi.fn(),
  fetchHistory: vi.fn(),
  stream: vi.fn(),
  submitContact: vi.fn(),
}));

vi.mock('@/features/smart-chat/chat-client', () => ({
  fetchSmartChatConfig: mocks.fetchConfig,
  fetchSmartChatHistory: mocks.fetchHistory,
  streamSmartChatMessage: mocks.stream,
  submitSmartChatContact: mocks.submitContact,
  mergeChatMessages: (current: unknown[], incoming: unknown[]) => [...current, ...incoming],
  replaceDraftMessage: (current: Array<{ _id: string | null }>, draftId: string, incoming: unknown) => [
    ...current.filter((message) => message._id !== draftId),
    incoming,
  ],
}));

vi.mock('vlist/react', () => ({
  useVList: () => ({
    containerRef: { current: null },
    instanceRef: { current: null },
    getInstance: () => null,
  }),
  useVListEvent: () => undefined,
}));

import { SmartChat } from '@/features/smart-chat/smart-chat';
import type { PublicSmartChatConfig } from '@/features/smart-chat/chat';

const config: PublicSmartChatConfig = {
  enabled: true,
  name: 'Flora',
  avatarUrl: null,
  introduction: 'Hi, I am Flora.',
  introductions: { ai: 'Hi, I am Flora.', wixUser: null, offline: null },
  legalDisclaimer: null,
  engage: null,
  suggestions: {
    enabled: true,
    questions: ['Which plant is easiest?'],
    introduction: null,
    displayWhenMinimized: false,
  },
  appearance: 'DESKTOP_AND_MOBILE',
  autoOpen: false,
  pages: null,
  activeHandlers: ['AI'],
  contact: null,
  whatsapp: null,
  offline: { hideWidget: false, allowChat: false, showContactForm: false, introduction: null },
  wixUser: null,
};

beforeEach(() => {
  mocks.fetchConfig.mockReset().mockResolvedValue(config);
  mocks.fetchHistory.mockReset().mockResolvedValue({ messages: [], nextCursor: null });
  mocks.stream.mockReset();
  mocks.submitContact.mockReset();
  window.sessionStorage.clear();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
});

describe('SmartChat', () => {
  it('opens the panel and sends a suggestion through the stream', async () => {
    const stream = mocks.stream.mockImplementation(
      async (_text: string, handlers: { onChunk: (chunk: string) => void }) => {
        handlers.onChunk('Try the **Cape Sundew**.');
        return new Promise(() => undefined);
      },
    );

    render(<SmartChat />);

    const launcher = await screen.findByLabelText('smart-chat.open');
    expect(launcher).toHaveAttribute('href', '/contact');

    fireEvent.click(launcher);

    expect(await screen.findByLabelText('smart-chat.title')).toBeInTheDocument();
    expect(screen.getByText('Hi, I am Flora.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Which plant is easiest?'));

    await waitFor(() => {
      expect(stream).toHaveBeenCalledWith(
        'Which plant is easiest?',
        expect.any(Object),
        expect.any(AbortSignal),
      );
    });

    expect(await screen.findByText('Try the', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Cape Sundew')).toBeInTheDocument();
  });
});
