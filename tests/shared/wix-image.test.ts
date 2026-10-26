import { describe, expect, it, vi } from 'vitest';
import { resolveWixImageUrl, scaledSrc, srcSet } from '@/shared/wix-image';

const { getScaledToFillImageUrl } = vi.hoisted(() => ({
  getScaledToFillImageUrl: vi.fn(),
}));

vi.mock('@wix/sdk', () => ({
  media: { getScaledToFillImageUrl },
}));

describe('resolveWixImageUrl', () => {
  it('returns null for empty input', () => {
    expect(resolveWixImageUrl(undefined)).toBeNull();
  });

  it('passes a plain URL through unchanged', () => {
    expect(resolveWixImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  it('resolves a bare media id through the media service', () => {
    expect(resolveWixImageUrl('600582_b252~mv2.png')).toBe(
      'https://static.wixstatic.com/media/600582_b252~mv2.png',
    );
  });

  it('appends width and height as query params', () => {
    expect(resolveWixImageUrl('https://cdn.example.com/a.png', 100)).toBe(
      'https://cdn.example.com/a.png?w=100',
    );
    expect(resolveWixImageUrl({ url: 'https://cdn.example.com/a.png' }, 100, 200)).toBe(
      'https://cdn.example.com/a.png?w=100&h=200',
    );
  });
});

describe('scaledSrc / srcSet', () => {
  const img = { url: 'https://cdn.example.com/a.png' };

  it('sets the w param', () => {
    expect(scaledSrc(img, 640)).toBe('https://cdn.example.com/a.png?w=640');
  });

  it('builds a width-descriptor srcset', () => {
    expect(srcSet(img, [320, 640])).toBe(
      'https://cdn.example.com/a.png?w=320 320w, https://cdn.example.com/a.png?w=640 640w',
    );
  });
});
