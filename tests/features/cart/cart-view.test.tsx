// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { cartFetch } = vi.hoisted(() => ({ cartFetch: vi.fn() }));

vi.mock('@wix/ecom', () => ({
  currentCart: {},
  currentCartV2: {},
}));

vi.mock('@wix/redirects', () => ({ redirects: {} }));

vi.mock('@/shared/analytics', () => ({ trackEvent: vi.fn() }));

import { CartView } from '@/features/cart/cart-view';

const labels = {
  empty: 'EMPTY_CART',
  errorLoad: 'LOAD_ERROR',
  retry: 'RETRY',
};

function jsonResponse(payload: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
}

beforeEach(() => {
  vi.stubGlobal('fetch', (...args: unknown[]) => cartFetch(...args));
});

afterEach(() => {
  cartFetch.mockReset();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

describe('CartView', () => {
  it('shows the empty state when the visitor has no cart', async () => {
    cartFetch.mockResolvedValue(jsonResponse({ cart: null }));
    render(<CartView labels={labels} />);
    expect(await screen.findByText('EMPTY_CART')).toBeInTheDocument();
  });

  it('shows a friendly error with retry instead of the empty state on a real failure', async () => {
    cartFetch.mockResolvedValue(jsonResponse({ cart: null, error: 'FAILED' }));
    render(<CartView labels={labels} />);
    expect(await screen.findByText('LOAD_ERROR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RETRY' })).toBeInTheDocument();
    expect(screen.queryByText('EMPTY_CART')).toBeNull();
  });

  it('shows the same friendly error when the request itself fails', async () => {
    cartFetch.mockRejectedValue(new Error('offline'));
    render(<CartView labels={labels} />);
    expect(await screen.findByText('LOAD_ERROR')).toBeInTheDocument();
  });

  it('recovers from the error state when retry succeeds', async () => {
    cartFetch
      .mockResolvedValueOnce(jsonResponse({ cart: null, error: 'FAILED' }))
      .mockResolvedValueOnce(jsonResponse({ cart: null }));
    render(<CartView labels={labels} />);

    fireEvent.click(await screen.findByRole('button', { name: 'RETRY' }));

    await waitFor(() => expect(screen.getByText('EMPTY_CART')).toBeInTheDocument());
    expect(screen.queryByText('LOAD_ERROR')).toBeNull();
    expect(cartFetch).toHaveBeenCalledTimes(2);
  });
});
