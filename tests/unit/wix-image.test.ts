import { describe, expect, it } from 'vitest';
import { resolveWixImageUrl, scaledSrc, srcSet } from '@/utils/wix-image';

describe('resolveWixImageUrl', () => {
  it('returns null for empty input', () => {
    expect(resolveWixImageUrl(undefined)).toBeNull();
  });

  it('passes a plain URL through unchanged', () => {
    expect(resolveWixImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
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
