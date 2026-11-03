import { describe, expect, it } from 'vitest';
import { sanitizeChatMessageInput } from '@/features/smart-chat/sanitize';

describe('sanitizeChatMessageInput', () => {
  it('strips HTML tags', () => {
    expect(sanitizeChatMessageInput('<script>alert("x")</script>Hi')).toBe('alert("x")Hi');
    expect(sanitizeChatMessageInput('see <strong>this</strong>')).toBe('see this');
  });

  it('removes control characters', () => {
    expect(sanitizeChatMessageInput('line\u0007break')).toBe('linebreak');
  });

  it('trims whitespace and returns an empty string for nothing but tags', () => {
    expect(sanitizeChatMessageInput('  hi  ')).toBe('hi');
    expect(sanitizeChatMessageInput('<br/>')).toBe('');
  });
});
