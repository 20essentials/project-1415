import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listMemberOrders } from '@/features/order-history/orders';

const searchOrders = vi.fn();

vi.mock('@wix/ecom', () => ({
  orders: {
    searchOrders: (...args: unknown[]) => searchOrders(...args),
  },
}));

const apiOrder = {
  _id: 'order-1',
  number: '1001',
  _createdDate: '2026-03-04T10:00:00.000Z',
  status: 'APPROVED',
  paymentStatus: 'PAID',
  currency: 'USD',
  buyerInfo: { email: 'grower@example.com' },
  priceSummary: {
    subtotal: { amount: '38.00', formattedAmount: '$38.00' },
    shipping: { amount: '6.00', formattedAmount: '$6.00' },
    tax: { amount: '3.42', formattedAmount: '$3.42' },
    discount: { amount: '0.00', formattedAmount: '$0.00' },
    total: { amount: '47.42', formattedAmount: '$47.42' },
  },
  lineItems: [
    {
      productName: { original: 'Venus Flytrap', translated: 'Venus flytrap' },
      quantity: 2,
      image: 'wix:image://v1/abc/file.jpg',
    },
  ],
};

describe('listMemberOrders', () => {
  beforeEach(() => {
    searchOrders.mockResolvedValue({ orders: [] });
  });

  afterEach(() => {
    searchOrders.mockReset();
    vi.restoreAllMocks();
  });

  it('searches scoped to the member email, newest first, limited to 20', async () => {
    await listMemberOrders('grower@example.com');

    expect(searchOrders).toHaveBeenCalledTimes(1);
    expect(searchOrders).toHaveBeenCalledWith({
      filter: { 'buyerInfo.email': { $eq: 'grower@example.com' } },
      sort: [{ fieldName: '_createdDate', order: 'DESC' }],
      cursorPaging: { limit: 20 },
    });
  });

  it('maps the API order to the view DTO', async () => {
    searchOrders.mockResolvedValue({ orders: [apiOrder] });

    const result = await listMemberOrders('grower@example.com');

    expect(result).toEqual([
      {
        id: 'order-1',
        orderNumber: '1001',
        createdDate: new Date('2026-03-04T10:00:00.000Z'),
        status: 'APPROVED',
        paymentStatus: 'PAID',
        currency: 'USD',
        buyerEmail: 'grower@example.com',
        priceSummary: {
          subtotal: { amount: '38.00', formattedAmount: '$38.00' },
          shipping: { amount: '6.00', formattedAmount: '$6.00' },
          tax: { amount: '3.42', formattedAmount: '$3.42' },
          discount: { amount: '0.00', formattedAmount: '$0.00' },
          total: { amount: '47.42', formattedAmount: '$47.42' },
        },
        lineItems: [{ title: 'Venus Flytrap', quantity: 2, image: 'wix:image://v1/abc/file.jpg' }],
      },
    ]);
  });

  it('never queries the API when the member has no email', async () => {
    await expect(listMemberOrders('   ')).resolves.toEqual([]);
    expect(searchOrders).not.toHaveBeenCalled();
  });

  it('returns an empty list when the search fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    searchOrders.mockRejectedValue(new Error('forbidden'));

    await expect(listMemberOrders('grower@example.com')).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalled();
  });
});
