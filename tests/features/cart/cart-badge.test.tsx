// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CartBadge } from '@/features/cart/cart-badge';

const cartFetch = vi.fn();

function okCart(payload: unknown): Promise<{ ok: boolean; json: () => Promise<unknown> }> {
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

describe('CartBadge', () => {
  it('renders an accessible cart link with no count when the cart is empty', async () => {
    cartFetch.mockResolvedValue(okCart({ cart: { lineItems: [] } }));
    render(<CartBadge />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/cart');
    await waitFor(() => expect(link).toHaveAccessibleName('Cart'));
    expect(link.querySelector('.cart-badge-count')).toBeNull();
  });

  it('sums item quantities and shows the count', async () => {
    cartFetch.mockResolvedValue(
      okCart({ cart: { lineItems: [{ quantity: 2 }, { quantity: 3 }] } }),
    );
    const { container } = render(<CartBadge />);
    await waitFor(() => expect(screen.getByRole('link')).toHaveAccessibleName('Cart, 5 items'));
    expect(container.querySelector('.cart-badge-count')?.textContent).toBe('5');
  });

  it('updates the count from a cart-updated event without refetching', async () => {
    cartFetch.mockResolvedValue(okCart({ cart: { lineItems: [] } }));
    const { container } = render(<CartBadge />);
    await waitFor(() => expect(screen.getByRole('link')).toHaveAccessibleName('Cart'));

    window.dispatchEvent(
      new CustomEvent('cart-updated', { detail: { cart: { lineItems: [{ quantity: 4 }] } } }),
    );

    await waitFor(() => expect(container.querySelector('.cart-badge-count')?.textContent).toBe('4'));
    expect(cartFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to 0 without throwing when the fetch fails', async () => {
    cartFetch.mockRejectedValue(new Error('offline'));
    render(<CartBadge />);
    const link = screen.getByRole('link');
    await waitFor(() => expect(link).toHaveAccessibleName('Cart'));
    expect(link.querySelector('.cart-badge-count')).toBeNull();
  });
});
