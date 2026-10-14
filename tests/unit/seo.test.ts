import { describe, expect, it } from 'vitest';
import { toMetaDescription } from '@/utils/seo';

describe('toMetaDescription', () => {
  it('strips HTML tags and collapses whitespace', () => {
    expect(toMetaDescription('<p>Drosera   capensis</p>', 'fallback')).toBe('Drosera capensis');
  });

  it('decodes common entities', () => {
    expect(toMetaDescription('Slug &amp; Snail&nbsp;trap', 'fallback')).toBe('Slug & Snail trap');
  });

  it('falls back when the source is empty', () => {
    expect(toMetaDescription(null, 'Browse our Carnivorous collection.')).toBe(
      'Browse our Carnivorous collection.',
    );
    expect(toMetaDescription('<p></p>', 'Fallback copy')).toBe('Fallback copy');
    expect(toMetaDescription('', 'Browse our Kits &amp; Accessories collection')).toBe(
      'Browse our Kits & Accessories collection',
    );
  });

  it('truncates long text at a word boundary with an ellipsis', () => {
    const long = 'a '.repeat(200);
    const result = toMetaDescription(long, 'fallback');
    expect(result.length).toBeLessThanOrEqual(155);
    expect(result.endsWith('…')).toBe(true);
  });
});
