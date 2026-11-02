import { describe, expect, it } from 'vitest';
import { parseChatText } from '@/features/smart-chat/chat-markdown';

describe('parseChatText', () => {
  it('splits plain text, bold text and links', () => {
    expect(parseChatText('Try the **Cape Sundew** at https://example.com/plant.')).toEqual([
      { type: 'text', value: 'Try the ' },
      { type: 'strong', value: 'Cape Sundew' },
      { type: 'text', value: ' at ' },
      { type: 'link', value: 'https://example.com/plant', href: 'https://example.com/plant' },
      { type: 'text', value: '.' },
    ]);
  });

  it('keeps non-http protocols as text', () => {
    expect(parseChatText('javascript:alert(1)')).toEqual([
      { type: 'text', value: 'javascript:alert(1)' },
    ]);
  });

  it('preserves punctuation that follows a link', () => {
    const segments = parseChatText('See https://example.com/a).');

    expect(segments[1]).toEqual({
      type: 'link',
      value: 'https://example.com/a',
      href: 'https://example.com/a',
    });
    expect(segments[2]).toEqual({ type: 'text', value: ').' });
  });
});
