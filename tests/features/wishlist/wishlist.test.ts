import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addToWishlist,
  isWished,
  listWishlist,
  listWishlistProducts,
  removeFromWishlist,
} from '@/features/wishlist/wishlist';

const query = vi.fn();
const insert = vi.fn();
const remove = vi.fn();
const queryProducts = vi.fn();

vi.mock('@wix/data', () => ({
  items: {
    query: (...args: unknown[]) => query(...args),
    insert: (...args: unknown[]) => insert(...args),
    remove: (...args: unknown[]) => remove(...args),
  },
}));

vi.mock('@wix/stores', () => ({
  productsV3: {
    queryProducts: (...args: unknown[]) => queryProducts(...args),
  },
}));

interface Call {
  method: string;
  args: unknown[];
}

interface Builder {
  calls: Call[];
  find: (...args: unknown[]) => Promise<{ items?: unknown[] }>;
}

function makeBuilder(result: { items?: unknown[] } = {}): Builder {
  const calls: Call[] = [];
  const builder = {} as Builder & Record<string, unknown>;
  for (const method of ['eq', 'descending', 'limit', 'in']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.find = vi.fn(() => {
    calls.push({ method: 'find', args: [] });
    return Promise.resolve(result);
  });
  builder.calls = calls;
  return builder;
}

beforeEach(() => {
  query.mockReturnValue(makeBuilder({ items: [] }));
  insert.mockResolvedValue({});
  remove.mockResolvedValue({});
  queryProducts.mockReturnValue(makeBuilder({ items: [] }));
});

afterEach(() => {
  query.mockReset();
  insert.mockReset();
  remove.mockReset();
  queryProducts.mockReset();
  vi.restoreAllMocks();
});

describe('listWishlist', () => {
  it('queries by member, newest first, and maps valid records', async () => {
    const builder = makeBuilder({
      items: [
        {
          _id: 'w1',
          memberId: 'm1',
          productId: 'p1',
          slug: 'venus-flytrap',
          createdDate: new Date('2026-03-04T10:00:00.000Z'),
        },
        { _id: 'w2', memberId: 'm1', productId: '', slug: 'skip' },
        { memberId: 'm1', productId: 'p3' },
      ],
    });
    query.mockReturnValue(builder);

    const result = await listWishlist('m1');

    expect(query).toHaveBeenCalledWith('wishlist');
    expect(builder.calls).toEqual([
      { method: 'eq', args: ['memberId', 'm1'] },
      { method: 'descending', args: ['createdDate'] },
      { method: 'limit', args: [100] },
      { method: 'find', args: [] },
    ]);
    expect(result).toEqual([
      {
        _id: 'w1',
        productId: 'p1',
        slug: 'venus-flytrap',
        createdDate: '2026-03-04T10:00:00.000Z',
      },
    ]);
  });

  it('returns an empty list without querying when memberId is empty', async () => {
    await expect(listWishlist('')).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });

  it('returns an empty list when the query fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const builder = makeBuilder();
    builder.find = vi.fn(() => Promise.reject(new Error('forbidden')));
    query.mockReturnValue(builder);

    await expect(listWishlist('m1')).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('isWished', () => {
  it('scopes the lookup to the member/product pair', async () => {
    const builder = makeBuilder({ items: [{ _id: 'w1' }] });
    query.mockReturnValue(builder);

    await expect(isWished('m1', 'p1')).resolves.toBe(true);
    expect(builder.calls).toEqual([
      { method: 'eq', args: ['memberId', 'm1'] },
      { method: 'eq', args: ['productId', 'p1'] },
      { method: 'limit', args: [1] },
      { method: 'find', args: [] },
    ]);
  });

  it('returns false without querying when ids are missing', async () => {
    await expect(isWished('', 'p1')).resolves.toBe(false);
    await expect(isWished('m1', '')).resolves.toBe(false);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('addToWishlist', () => {
  it('inserts the member, product and slug when not saved yet', async () => {
    query.mockReturnValue(makeBuilder({ items: [] }));

    await addToWishlist('m1', { productId: 'p1', slug: 'venus-flytrap' });

    expect(insert).toHaveBeenCalledTimes(1);
    const [collection, item] = insert.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(collection).toBe('wishlist');
    expect(item).toMatchObject({ memberId: 'm1', productId: 'p1', slug: 'venus-flytrap' });
    expect(item.createdDate).toBeInstanceOf(Date);
  });

  it('is idempotent and skips the insert when already saved', async () => {
    query.mockReturnValue(makeBuilder({ items: [{ _id: 'w1', productId: 'p1' }] }));

    await addToWishlist('m1', { productId: 'p1' });

    expect(insert).not.toHaveBeenCalled();
  });

  it('does nothing when the member or product id is missing', async () => {
    await addToWishlist('', { productId: 'p1' });
    await addToWishlist('m1', { productId: '' });
    expect(query).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});

describe('removeFromWishlist', () => {
  it('removes every stored record for the member/product pair', async () => {
    query.mockReturnValue(makeBuilder({ items: [{ _id: 'w1' }, { _id: 'w2' }] }));

    await removeFromWishlist('m1', 'p1');

    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenNthCalledWith(1, 'wishlist', 'w1');
    expect(remove).toHaveBeenNthCalledWith(2, 'wishlist', 'w2');
  });

  it('skips records without an id', async () => {
    query.mockReturnValue(makeBuilder({ items: [{ productId: 'p1' }] }));

    await removeFromWishlist('m1', 'p1');

    expect(remove).not.toHaveBeenCalled();
  });

  it('does nothing when the member or product id is missing', async () => {
    await removeFromWishlist('', 'p1');
    await removeFromWishlist('m1', '');
    expect(query).not.toHaveBeenCalled();
  });
});

describe('listWishlistProducts', () => {
  it('queries the saved ids and keeps wishlist order', async () => {
    query.mockReturnValue(
      makeBuilder({
        items: [
          { _id: 'w1', productId: 'p1' },
          { _id: 'w2', productId: 'p2' },
        ],
      }),
    );
    const productBuilder = makeBuilder({ items: [{ _id: 'p2' }, { _id: 'p1' }] });
    queryProducts.mockReturnValue(productBuilder);

    const result = await listWishlistProducts('m1');

    expect(queryProducts).toHaveBeenCalledWith({
      fields: ['CURRENCY', 'MIN_PRICE_VARIANT', 'DISCOUNT_INFO'],
    });
    expect(productBuilder.calls).toEqual([
      { method: 'in', args: ['_id', ['p1', 'p2']] },
      { method: 'limit', args: [24] },
      { method: 'find', args: [] },
    ]);
    expect(result.map((product) => product._id)).toEqual(['p1', 'p2']);
  });

  it('returns an empty list without querying products when nothing is saved', async () => {
    query.mockReturnValue(makeBuilder({ items: [] }));

    await expect(listWishlistProducts('m1')).resolves.toEqual([]);
    expect(queryProducts).not.toHaveBeenCalled();
  });

  it('returns an empty list when the products query fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    query.mockReturnValue(makeBuilder({ items: [{ _id: 'w1', productId: 'p1' }] }));
    const productBuilder = makeBuilder();
    productBuilder.find = vi.fn(() => Promise.reject(new Error('boom')));
    queryProducts.mockReturnValue(productBuilder);

    await expect(listWishlistProducts('m1')).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalled();
  });
});
