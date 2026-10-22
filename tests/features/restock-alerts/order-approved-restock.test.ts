import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (event: {
  data: { order?: { _id?: string; lineItems?: unknown[] } };
  metadata?: unknown;
}) => Promise<void>;

let capturedHandler: Handler | undefined;

vi.mock('@wix/ecom', () => ({
  orders: {
    onOrderApproved: (handler: Handler) => {
      capturedHandler = handler;
      return handler;
    },
  },
}));

const queryInventoryItems = vi.fn();
const queryProducts = vi.fn();
const query = vi.fn();
const insert = vi.fn();
const update = vi.fn();

vi.mock('@wix/stores', () => ({
  inventoryItemsV3: {
    queryInventoryItems: (...args: unknown[]) => queryInventoryItems(...args),
  },
  productsV3: {
    queryProducts: (...args: unknown[]) => queryProducts(...args),
  },
}));

vi.mock('@wix/data', () => ({
  items: {
    query: (...args: unknown[]) => query(...args),
    insert: (...args: unknown[]) => insert(...args),
    update: (...args: unknown[]) => update(...args),
  },
}));

const WIX_STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e';

interface Builder {
  find: () => Promise<{ items?: unknown[] }>;
}

function makeBuilder(result: { items?: unknown[] } = {}): Builder & Record<string, unknown> {
  const builder = {} as Builder & Record<string, unknown>;
  for (const method of ['eq', 'in', 'descending', 'limit']) {
    builder[method] = () => builder;
  }
  builder.find = vi.fn(() => Promise.resolve(result));
  return builder;
}

function lineItem(productId: string, appId = WIX_STORES_APP_ID) {
  return {
    _id: `li-${productId}`,
    quantity: 1,
    catalogReference: { appId, catalogItemId: productId },
  };
}

beforeEach(async () => {
  capturedHandler = undefined;
  queryInventoryItems.mockReturnValue(makeBuilder({ items: [] }));
  queryProducts.mockReturnValue(makeBuilder({ items: [] }));
  query.mockReturnValue(makeBuilder({ items: [] }));
  insert.mockResolvedValue({});
  update.mockResolvedValue({});
  vi.resetModules();
  await import('@/extensions/backend/events/order-approved-restock/order-approved-restock');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('order-approved-restock handler', () => {
  it('registers an order approved handler', () => {
    expect(capturedHandler).toBeTypeOf('function');
  });

  it('does nothing when the order has no id or line items', async () => {
    await capturedHandler?.({ data: {} });
    await capturedHandler?.({ data: { order: { _id: 'o1', lineItems: [] } } });
    expect(queryInventoryItems).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('ignores line items that are not from Wix Stores', async () => {
    await capturedHandler?.({
      data: { order: { _id: 'o1', lineItems: [lineItem('p1', 'other-app')] } },
    });
    expect(queryInventoryItems).not.toHaveBeenCalled();
  });

  it('skips products that are not low on stock', async () => {
    queryInventoryItems.mockReturnValue(
      makeBuilder({ items: [{ productId: 'p1', quantity: 10, trackQuantity: true }] }),
    );

    await capturedHandler?.({
      data: { order: { _id: 'o1', lineItems: [lineItem('p1')] } },
    });

    expect(insert).not.toHaveBeenCalled();
  });

  it('writes an alert with slug and summed remaining when stock is low', async () => {
    queryInventoryItems.mockReturnValue(
      makeBuilder({ items: [{ productId: 'p1', quantity: 1, trackQuantity: true }] }),
    );
    queryProducts.mockReturnValue(
      makeBuilder({ items: [{ _id: 'p1', slug: 'venus-flytrap' }] }),
    );

    await capturedHandler?.({
      data: { order: { _id: 'o1', lineItems: [lineItem('p1')] } },
    });

    expect(insert).toHaveBeenCalledTimes(1);
    const [, item] = insert.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(item).toMatchObject({
      orderId: 'o1',
      productId: 'p1',
      slug: 'venus-flytrap',
      remaining: 1,
      status: 'pending',
    });
  });

  it('treats untracked inventory as sufficiently stocked', async () => {
    queryInventoryItems.mockReturnValue(
      makeBuilder({ items: [{ productId: 'p1', trackQuantity: false }] }),
    );

    await capturedHandler?.({
      data: { order: { _id: 'o1', lineItems: [lineItem('p1')] } },
    });

    expect(insert).not.toHaveBeenCalled();
  });

  it('keeps processing when one product fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    queryInventoryItems.mockImplementation((..._args: unknown[]) => makeBuilder({ items: [] }));
    insert.mockRejectedValueOnce(new Error('write failed')).mockResolvedValueOnce({});

    await capturedHandler?.({
      data: { order: { _id: 'o1', lineItems: [lineItem('p1'), lineItem('p2')] } },
    });

    expect(insert).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalled();
  });
});
