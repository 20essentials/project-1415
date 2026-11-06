import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCurrentCart } = vi.hoisted(() => ({ getCurrentCart: vi.fn() }));

vi.mock('@wix/ecom', () => ({ currentCart: { getCurrentCart } }));

import { GET } from '@/pages/api/cart-current';

const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

async function payload(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  getCurrentCart.mockReset();
  errorSpy.mockClear();
});

afterEach(() => {
  errorSpy.mockClear();
});

describe('GET /api/cart-current', () => {
  it('returns the current cart', async () => {
    getCurrentCart.mockResolvedValue({ _id: 'cart-1' });
    const response = await GET({} as never);
    expect(response.status).toBe(200);
    expect(await payload(response)).toEqual({ cart: { _id: 'cart-1' } });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('returns cart:null without logging when the visitor has no cart yet', async () => {
    getCurrentCart.mockRejectedValue({
      status: 404,
      details: { applicationError: { code: 'OWNED_CART_NOT_FOUND' } },
    });
    const response = await GET({} as never);
    expect(response.status).toBe(200);
    expect(await payload(response)).toEqual({ cart: null });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('flags unexpected failures and logs them', async () => {
    getCurrentCart.mockRejectedValue(new Error('boom'));
    const response = await GET({} as never);
    expect(response.status).toBe(200);
    expect(await payload(response)).toEqual({ cart: null, error: 'FAILED' });
    expect(errorSpy).toHaveBeenCalledOnce();
  });
});
