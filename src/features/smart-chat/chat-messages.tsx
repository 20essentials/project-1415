import { useEffect, useMemo, useRef, type Ref } from 'react';
import 'vlist/styles';
import { autosize } from 'vlist';
import { useVList, useVListEvent } from 'vlist/react';
import type { ChatMessage } from './chat';
import {
  createMessageElement,
  type ChatListItem,
  type ChatMessageVariant,
} from './chat-message-view';

interface ChatMessagesProps {
  messages: ChatMessage[];
  speakerName: string;
  avatarUrl: string | null;
  humanName: string | null;
  humanLabel: string;
  locale: string;
  hasEarlier: boolean;
  loadingEarlier: boolean;
  onLoadEarlier: () => void;
}

const EMPTY_SPEAKER = 'Petals & Predators';
const SMART_CHAT_PLUGINS = [autosize<ChatListItem>()];

function variantFor(message: ChatMessage): ChatMessageVariant {
  if (
    message.messageType === 'OFFLINE' ||
    message.messageType === 'OUT_OF_QUOTA' ||
    message.messageType === 'SYSTEM' ||
    message.sender === 'SYSTEM'
  ) {
    return 'system';
  }

  if (
    message.sender === 'WIX_USER' ||
    message.sender === 'SITE_OWNER' ||
    message.sender === 'HUMAN'
  ) {
    return 'human';
  }

  if (
    message.sender === 'USER' ||
    message.sender === 'SITE_VISITOR' ||
    message.messageType === 'QUESTION' ||
    message.messageType === 'USER_QUESTION'
  ) {
    return 'user';
  }

  return 'assistant';
}

function buildItems(
  messages: ChatMessage[],
  speakerName: string,
  avatarUrl: string | null,
  humanName: string | null,
  humanLabel: string,
  locale: string,
): ChatListItem[] {
  const chronological = messages.map((message, index) => {
    const variant = variantFor(message);
    const previous = index > 0 ? variantFor(messages[index - 1]) : null;
    const isHuman = variant === 'human';
    return {
      id: message._id ?? `local-${index}`,
      message,
      variant,
      speakerName: isHuman ? humanName ?? speakerName ?? EMPTY_SPEAKER : speakerName || EMPTY_SPEAKER,
      humanLabel: isHuman ? humanLabel : null,
      avatarUrl: isHuman ? null : avatarUrl,
      showAvatar: variant !== 'user' && variant !== 'system' && variant !== previous,
      locale,
    } satisfies ChatListItem;
  });

  return chronological;
}

export function ChatMessages({
  messages,
  speakerName,
  avatarUrl,
  humanName,
  humanLabel,
  locale,
  hasEarlier,
  loadingEarlier,
  onLoadEarlier,
}: ChatMessagesProps) {
  const items = useMemo(
    () => buildItems(messages, speakerName, avatarUrl, humanName, humanLabel, locale),
    [messages, speakerName, avatarUrl, humanName, humanLabel, locale],
  );
  const total = items.length;
  const newestId = items[total - 1]?.id ?? null;
  const previousNewestId = useRef<string | null>(null);
  const previousTotal = useRef(0);
  const anchorId = useRef<string | null>(null);
  const loadRequested = useRef(false);
  const stickToBottom = useRef(true);
  const totalRef = useRef(total);
  totalRef.current = total;

  const { containerRef, instanceRef } = useVList<ChatListItem>(
    {
      items,
      reverse: true,
      overscan: 6,
      padding: [12, 16, 12, 16],
      item: {
        estimatedHeight: 76,
        gap: 12,
        template: (item) => createMessageElement(item),
      },
    },
    SMART_CHAT_PLUGINS,
  );

  useVListEvent(instanceRef, 'range:change', ({ range }) => {
    const first = instanceRef.current?.getItemAt(range.start);
    if (first) anchorId.current = first.id;
    if (!hasEarlier || loadingEarlier || total < 8) return;
    if (range.start > 1) return;
    if (loadRequested.current) return;
    loadRequested.current = true;
    onLoadEarlier();
  });

  useEffect(() => {
    if (total > previousTotal.current) {
      loadRequested.current = false;
    }

    if (newestId && newestId !== previousNewestId.current) {
      stickToBottom.current = true;
      instanceRef.current?.scrollToIndex(total - 1, { align: 'end' });
    } else if (total > previousTotal.current && anchorId.current) {
      stickToBottom.current = false;
      const index = instanceRef.current?.getIndexById(anchorId.current) ?? -1;
      if (index >= 0) instanceRef.current?.scrollToIndex(index, { align: 'start' });
    }

    previousNewestId.current = newestId;
    previousTotal.current = total;
  }, [newestId, total, instanceRef]);

  useEffect(() => {
    if (total > 0) return;
    loadRequested.current = false;
    anchorId.current = null;
  }, [total]);

  useEffect(() => {
    const container = containerRef.current;
    const viewport = container?.querySelector<HTMLElement>('.vlist-viewport');
    const content = container?.querySelector<HTMLElement>('.vlist-content');
    if (!viewport || !content) return;

    const keepAtBottom = () => {
      if (stickToBottom.current && totalRef.current > 0) {
        instanceRef.current?.scrollToIndex(totalRef.current - 1, { align: 'end' });
      }
    };

    const onScroll = () => {
      const distance = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
      stickToBottom.current = distance <= 8;
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    keepAtBottom();
    const observer = new ResizeObserver(keepAtBottom);
    observer.observe(content);
    return () => {
      viewport.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [containerRef, instanceRef]);

  return (
    <div
      ref={containerRef as unknown as Ref<HTMLDivElement>}
      className="pp-chat-messages"
      aria-live="polite"
    />
  );
}
