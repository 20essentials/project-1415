// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CartBadge from '@/features/cart/cart-badge';

const getCurrentCart = vi.fn();

vi.mock('@wix/ecom', () => ({
  currentCart: {
    getCurrentCart: (...args: unknown[]) => getCurrentCart(...args),
  },
}));

afterEach(() => {
  getCurrentCart.mockReset();
  window.sessionStorage.clear();
});

describe('CartBadge', () => {
  it('renders an accessible cart link with no count when empty', async () => {
    getCurrentCart.mockResolvedValue({ lineItems: [] });
    render(<CartBadge />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/cart');
    await waitFor(() => expect(link).toHaveAccessibleName('Cart'));
    expect(link.querySelector('.cart-badge-count')).toBeNull();
  });

  it('sums item quantities and shows the count', async () => {
    getCurrentCart.mockResolvedValue({
      lineItems: [{ quantity: 2 }, { quantity: 3 }],
    });
    const { container } = render(<CartBadge />);
    await waitFor(() => expect(screen.getByRole('link')).toHaveAccessibleName('Cart, 5 items'));
    expect(container.querySelector('.cart-badge-count')?.textContent).toBe('5');
  });

  it('updates the count from a cart-updated event without refetching', async () => {
    getCurrentCart.mockResolvedValue({ lineItems: [] });
    const { container } = render(<CartBadge />);
    await waitFor(() => expect(screen.getByRole('link')).toHaveAccessibleName('Cart'));

    window.dispatchEvent(
      new CustomEvent('cart-updated', { detail: { cart: { lineItems: [{ quantity: 4 }] } } }),
    );

    await waitFor(() => expect(container.querySelector('.cart-badge-count')?.textContent).toBe('4'));
    expect(getCurrentCart).toHaveBeenCalledTimes(1);
  });
});
