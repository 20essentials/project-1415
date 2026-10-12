import { describe, expect, it } from 'vitest';
import { getPublicOrigin, isSafeReturnUrl } from '@/pages/login';

const origin = 'https://shop.example.com';

describe('getPublicOrigin', () => {
  it('prefers the forwarded public origin', () => {
    const request = new Request(`${origin}/login`, {
      headers: { 'x-wix-forwarded-url': 'https://public.example.com/anything?x=1' },
    });
    expect(getPublicOrigin(request, new URL(`${origin}/login`))).toBe('https://public.example.com');
  });

  it('falls back to the request origin without a forwarded header', () => {
    const request = new Request(`http://localhost:4322/login`);
    expect(getPublicOrigin(request, new URL('http://localhost:4322/login'))).toBe('http://localhost:4322');
  });

  it('ignores a non-http forwarded value', () => {
    const request = new Request(`${origin}/login`, {
      headers: { 'x-wix-forwarded-url': 'javascript:alert(1)' },
    });
    expect(getPublicOrigin(request, new URL(`${origin}/login`))).toBe(origin);
  });
});

describe('isSafeReturnUrl', () => {
  const url = new URL(`${origin}/login`);

  it('accepts an absolute-path relative URL', () => {
    expect(isSafeReturnUrl('/account', url)).toBe(true);
    expect(isSafeReturnUrl('/es/account?tab=orders', url)).toBe(true);
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(isSafeReturnUrl('https://evil.example.com', url)).toBe(false);
    expect(isSafeReturnUrl('//evil.example.com', url)).toBe(false);
  });

  it('rejects values that do not start with a slash', () => {
    expect(isSafeReturnUrl('account', url)).toBe(false);
    expect(isSafeReturnUrl('', url)).toBe(false);
  });
});
