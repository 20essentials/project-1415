import { resolveWixImageUrl } from '@/shared/wix-image';
import type { ChatMessage } from './chat';
import { parseChatText } from './chat-markdown';

export type ChatMessageVariant = 'user' | 'assistant' | 'human' | 'system';

export interface ChatListItem {
  id: string;
  message: ChatMessage;
  variant: ChatMessageVariant;
  speakerName: string;
  avatarUrl: string | null;
  showAvatar: boolean;
  locale: string;
}

const SYSTEM_TYPES = new Set(['OFFLINE', 'OUT_OF_QUOTA', 'SYSTEM']);

function safeHref(value: string): string | null {
  if (value.startsWith('/')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function stringField(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

function appendText(parent: HTMLElement, text: string): void {
  for (const segment of parseChatText(text)) {
    if (segment.type === 'strong') {
      const strong = document.createElement('strong');
      strong.textContent = segment.value;
      parent.append(strong);
      continue;
    }

    if (segment.type === 'link') {
      const href = safeHref(segment.href);
      if (!href) {
        parent.append(document.createTextNode(segment.value));
        continue;
      }
      const link = document.createElement('a');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = segment.value;
      parent.append(link);
      continue;
    }

    parent.append(document.createTextNode(segment.value));
  }
}

function appendAvatar(item: ChatListItem): HTMLElement {
  const avatar = document.createElement('span');
  avatar.className = 'pp-chat-avatar';
  avatar.setAttribute('aria-hidden', 'true');

  if (item.avatarUrl) {
    const image = document.createElement('img');
    image.src = item.avatarUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.width = 28;
    image.height = 28;
    avatar.append(image);
  } else {
    avatar.textContent = item.speakerName.trim().charAt(0).toUpperCase() || 'P';
  }

  return avatar;
}

function appendProductCards(bubble: HTMLElement, message: ChatMessage): void {
  const cards = (message.body.additionalData ?? [])
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const title = stringField(item, ['title', 'name', 'productName']);
      const rawUrl = stringField(item, ['url', 'link', 'productUrl']);
      if (!title || !rawUrl) return null;

      const href = safeHref(rawUrl);
      if (!href) return null;

      return {
        title,
        href,
        image: stringField(item, ['img', 'image', 'imageUrl', 'mainImage']),
        price: stringField(item, ['price', 'formattedPrice', 'formattedValue']),
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null)
    .slice(0, 3);

  if (cards.length === 0) return;

  const list = document.createElement('div');
  list.className = 'pp-chat-cards';

  for (const card of cards) {
    const link = document.createElement('a');
    link.className = 'pp-chat-card';
    link.href = card.href;
    if (/^https?:/.test(card.href)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    const imageUrl = resolveWixImageUrl(card.image, 112, 112);
    if (imageUrl) {
      const image = document.createElement('img');
      image.className = 'pp-chat-card__image';
      image.src = imageUrl;
      image.alt = '';
      image.loading = 'lazy';
      image.width = 56;
      image.height = 56;
      link.append(image);
    }

    const copy = document.createElement('span');
    copy.className = 'pp-chat-card__copy';

    const title = document.createElement('span');
    title.className = 'pp-chat-card__title';
    title.textContent = card.title;
    copy.append(title);

    if (card.price) {
      const price = document.createElement('span');
      price.className = 'pp-chat-card__price';
      price.textContent = card.price;
      copy.append(price);
    }

    link.append(copy);
    list.append(link);
  }

  bubble.append(list);
}

function formatTime(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function createMessageElement(item: ChatListItem): HTMLElement {
  const { message, variant } = item;
  const article = document.createElement('article');
  article.className = `pp-chat-item pp-chat-item--${variant}`;
  article.dataset.messageId = item.id;

  const isSystem = variant === 'system' || SYSTEM_TYPES.has(message.messageType ?? '');
  const row = document.createElement('div');
  row.className = 'pp-chat-row';

  if (!isSystem && variant !== 'user' && item.showAvatar) {
    row.append(appendAvatar(item));
  }

  const content = document.createElement('div');
  content.className = 'pp-chat-content';

  if (!isSystem && variant !== 'user' && item.showAvatar) {
    const name = document.createElement('span');
    name.className = 'pp-chat-name';
    name.textContent = item.speakerName;
    content.append(name);
  }

  const bubble = document.createElement('div');
  bubble.className = `pp-chat-bubble pp-chat-bubble--${isSystem ? 'system' : variant}`;

  const text = message.body.mainText ?? '';
  if (text) appendText(bubble, text);

  appendProductCards(bubble, message);

  if (message.body.footerText) {
    const footer = document.createElement('p');
    footer.className = 'pp-chat-bubble__footer';
    footer.textContent = message.body.footerText;
    bubble.append(footer);
  }

  content.append(bubble);

  const time = formatTime(message._createdDate, item.locale);
  if (time && !isSystem) {
    const timestamp = document.createElement('time');
    timestamp.className = 'pp-chat-time';
    timestamp.dateTime = message._createdDate ?? '';
    timestamp.textContent = time;
    content.append(timestamp);
  }

  row.append(content);
  article.append(row);
  return article;
}
