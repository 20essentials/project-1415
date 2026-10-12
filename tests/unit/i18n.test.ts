import { describe, expect, it } from 'vitest';
import { localeUrl, stripLocalePrefix } from '@/utils/i18n';

describe('stripLocalePrefix', () => {
  it('leaves the primary locale path untouched', () => {
    expect(stripLocalePrefix('/products')).toBe('/products');
  });

  it('strips a non-primary locale prefix', () => {
    expect(stripLocalePrefix('/es/products')).toBe('/products');
    expect(stripLocalePrefix('/it/journal/care')).toBe('/journal/care');
  });

  it('collapses a bare locale home to "/"', () => {
    expect(stripLocalePrefix('/es')).toBe('/');
    expect(stripLocalePrefix('/es/')).toBe('/');
  });

  it('keeps the root and unknown prefixes as-is', () => {
    expect(stripLocalePrefix('/')).toBe('/');
    expect(stripLocalePrefix('/de/products')).toBe('/de/products');
  });
});

describe('localeUrl', () => {
  it('returns the clean path for the primary locale', () => {
    expect(localeUrl('/es/products', 'en')).toBe('/products');
    expect(localeUrl('/products', 'en')).toBe('/products');
  });

  it('prefixes non-primary locales', () => {
    expect(localeUrl('/products', 'es')).toBe('/es/products');
    expect(localeUrl('/it/products', 'es')).toBe('/es/products');
  });

  it('handles the home path without doubling the slash', () => {
    expect(localeUrl('/', 'it')).toBe('/it');
    expect(localeUrl('/es/', 'en')).toBe('/');
  });
});
