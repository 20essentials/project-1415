import { describe, expect, it } from 'vitest';
import {
  normalizeCart,
  normalizeCoupons,
  normalizeLineItem,
  normalizeTotals,
} from '@/features/cart/cart-shape';

const v1GiftCardCart = {
  id: '9591c750-3658-4987-9605-f962fc878c9d',
  currency: 'EUR',
  paymentCurrency: 'EUR',
  lineItems: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      quantity: 1,
      productName: { original: 'eGift Card', translated: 'eGift Card' },
      price: {
        amount: '25',
        convertedAmount: '25',
        formattedAmount: '25,00€',
        formattedConvertedAmount: '25,00€',
      },
      lineItemPrice: {
        amount: '25',
        convertedAmount: '25',
        formattedAmount: '25,00€',
        formattedConvertedAmount: '25,00€',
      },
      image: {
        id: 'e90a2a_c3de803545f340df9dd4aa88a72e0718~mv2.png',
        url: 'https://static.wixstatic.com/media/e90a2a_c3de803545f340df9dd4aa88a72e0718~mv2.png',
        height: 600,
        width: 600,
      },
      itemType: { preset: 'GIFT_CARD' },
      rootCatalogItemId: '34e53e4e-a329-4aef-b4b2-6f4350f944e2',
    },
  ],
  subtotal: { amount: '25', convertedAmount: '25', formattedAmount: '25,00€' },
  subtotalAfterDiscounts: { amount: '25', convertedAmount: '25', formattedAmount: '25,00€' },
  discount: { amount: '0', convertedAmount: '0', formattedAmount: '0,00€' },
  appliedDiscounts: [],
};

describe('cart-shape: normalizeLineItem', () => {
  it('reads the v1 shape (id, productName, price, lineItemPrice)', () => {
    const item = normalizeLineItem(v1GiftCardCart.lineItems[0]);

    expect(item).not.toBeNull();
    expect(item!.id).toBe('00000000-0000-0000-0000-000000000001');
    expect(item!.title).toBe('eGift Card');
    expect(item!.quantity).toBe(1);
    expect(item!.unitPrice).toBe(25);
    expect(item!.lineTotal).toBe(25);
    expect(item!.formattedLineTotal).toBe('25,00€');
  });

  it('reads the v2 shape (_id, name, pricing.totalPrice)', () => {
    const item = normalizeLineItem({
      _id: 'v2-line-id',
      name: { original: 'Carnivorous Starter Kit', translated: 'Carnivorous Starter Kit' },
      quantityInfo: { confirmedQuantity: 2 },
      pricing: {
        unitPrice: { amount: '45', convertedAmount: '45' },
        totalPrice: { amount: '90', convertedAmount: '90' },
      },
    });

    expect(item).not.toBeNull();
    expect(item!.id).toBe('v2-line-id');
    expect(item!.title).toBe('Carnivorous Starter Kit');
    expect(item!.unitPrice).toBe(45);
    expect(item!.lineTotal).toBe(90);
  });

  it('falls back to unit price times quantity when there is no line total', () => {
    const item = normalizeLineItem({ id: 'x', quantity: 3, price: { amount: '10' } });

    expect(item!.unitPrice).toBe(10);
    expect(item!.lineTotal).toBe(30);
  });

  it('drops items without an id', () => {
    expect(normalizeLineItem({ productName: { original: 'Sin id' } })).toBeNull();
    expect(normalizeLineItem(null)).toBeNull();
  });
});

describe('cart-shape: normalizeCoupons', () => {
  it('reads v2 coupons', () => {
    expect(normalizeCoupons({ coupons: [{ _id: 'c1', code: 'SAVE10' }] })).toEqual([
      { id: 'c1', code: 'SAVE10' },
    ]);
  });

  it('reads v1 applied discounts', () => {
    expect(
      normalizeCoupons({ appliedDiscounts: [{ coupon: { _id: 'c2', code: 'WELCOME' } }] })
    ).toEqual([{ id: 'c2', code: 'WELCOME' }]);
  });

  it('returns an empty list when there are none', () => {
    expect(normalizeCoupons({ appliedDiscounts: [] })).toEqual([]);
    expect(normalizeCoupons(null)).toEqual([]);
  });
});

describe('cart-shape: normalizeTotals', () => {
  it('reads the v1 totals and currency', () => {
    const totals = normalizeTotals(v1GiftCardCart);

    expect(totals.currency).toBe('EUR');
    expect(totals.subtotal).toBe(25);
    expect(totals.discount).toBe(0);
    expect(totals.total).toBe(25);
    expect(totals.formattedSubtotal).toBe('25,00€');
  });

  it('derives the total from subtotal minus discount when absent', () => {
    const totals = normalizeTotals({
      subtotal: { amount: '100' },
      discount: { amount: '10' },
    });

    expect(totals.subtotal).toBe(100);
    expect(totals.discount).toBe(10);
    expect(totals.total).toBe(90);
  });

  it('reads the v2 ConvertedMoney subtotal and business currency', () => {
    const totals = normalizeTotals({
      subtotal: { amount: '45', convertedAmount: '45' },
      businessInfo: { currencyCode: 'EUR' },
    });

    expect(totals.currency).toBe('EUR');
    expect(totals.subtotal).toBe(45);
    expect(totals.total).toBe(45);
  });

  it('returns zeroed totals for an empty cart', () => {
    const totals = normalizeTotals({});

    expect(totals.currency).toBeNull();
    expect(totals.subtotal).toBe(0);
    expect(totals.total).toBe(0);
  });
});

describe('cart-shape: normalizeCart', () => {
  it('normalizes the live v1 cart', () => {
    const cart = normalizeCart(v1GiftCardCart);

    expect(cart.lineItems).toHaveLength(1);
    expect(cart.lineItems[0].title).toBe('eGift Card');
    expect(cart.lineItems[0].lineTotal).toBe(25);
    expect(cart.coupons).toEqual([]);
    expect(cart.totals.currency).toBe('EUR');
    expect(cart.totals.total).toBe(25);
  });

  it('normalizes an empty cart', () => {
    const cart = normalizeCart({});

    expect(cart.lineItems).toEqual([]);
    expect(cart.coupons).toEqual([]);
    expect(cart.totals.subtotal).toBe(0);
  });
});
