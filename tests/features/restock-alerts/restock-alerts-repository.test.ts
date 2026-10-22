import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RESTOCK_ALERTS_COLLECTION,
  findAlert,
  listAlerts,
  resolveAlert,
  upsertAlert,
} from '@/features/restock-alerts/restock-alerts-repository';

const query = vi.fn();
const insert = vi.fn();
const update = vi.fn();

vi.mock('@wix/data', () => ({
  items: {
    query: (...args: unknown[]) => query(...args),
    insert: (...args: unknown[]) => insert(...args),
    update: (...args: unknown[]) => update(...args),
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
  for (const method of ['eq', 'ascending', 'descending', 'limit']) {
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
  update.mockResolvedValue({});
});

afterEach(() => {
  query.mockReset();
  insert.mockReset();
  update.mockReset();
  vi.restoreAllMocks();
});

describe('listAlerts', () => {
  it('lists every alert newest first when no status filter is given', async () => {
    const builder = makeBuilder({
      items: [
        { _id: 'a1', status: 'pending', remaining: 1, threshold: 2 },
        { _id: 'a2', status: 'resolved', remaining: 5, threshold: 2 },
      ],
    });
    query.mockReturnValue(builder);

    const result = await listAlerts();

    expect(query).toHaveBeenCalledWith(RESTOCK_ALERTS_COLLECTION);
    expect(builder.calls).toEqual([
      { method: 'descending', args: ['createdDate'] },
      { method: 'limit', args: [100] },
      { method: 'find', args: [] },
    ]);
    expect(result.map((alert) => alert._id)).toEqual(['a1', 'a2']);
    expect(result[0]?.status).toBe('pending');
  });

  it('filters by status when provided', async () => {
    const builder = makeBuilder({ items: [] });
    query.mockReturnValue(builder);

    await listAlerts('pending');

    expect(builder.calls[0]).toEqual({ method: 'eq', args: ['status', 'pending'] });
  });
});

describe('findAlert', () => {
  it('scopes the lookup to the order/product pair', async () => {
    const builder = makeBuilder({ items: [{ _id: 'a1' }] });
    query.mockReturnValue(builder);

    const alert = await findAlert('o1', 'p1');

    expect(builder.calls).toEqual([
      { method: 'eq', args: ['orderId', 'o1'] },
      { method: 'eq', args: ['productId', 'p1'] },
      { method: 'limit', args: [1] },
      { method: 'find', args: [] },
    ]);
    expect(alert?._id).toBe('a1');
  });

  it('returns null when no alert matches', async () => {
    query.mockReturnValue(makeBuilder({ items: [] }));
    await expect(findAlert('o1', 'p1')).resolves.toBeNull();
  });
});

describe('upsertAlert', () => {
  const draft = { orderId: 'o1', productId: 'p1', remaining: 1, threshold: 2 };

  it('inserts a pending alert when none exists for the pair', async () => {
    query.mockReturnValue(makeBuilder({ items: [] }));
    insert.mockResolvedValue({ _id: 'a1', status: 'pending', ...draft });

    const alert = await upsertAlert(draft);

    expect(insert).toHaveBeenCalledTimes(1);
    const [collection, item] = insert.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(collection).toBe(RESTOCK_ALERTS_COLLECTION);
    expect(item).toMatchObject({ ...draft, status: 'pending' });
    expect(item.createdDate).toBeInstanceOf(Date);
    expect(update).not.toHaveBeenCalled();
    expect(alert._id).toBe('a1');
  });

  it('updates the existing alert instead of inserting a duplicate', async () => {
    query.mockReturnValue(makeBuilder({ items: [{ _id: 'a1', orderId: 'o1', productId: 'p1' }] }));
    update.mockResolvedValue({ _id: 'a1', status: 'pending', ...draft, remaining: 1 });

    const alert = await upsertAlert({ ...draft, remaining: 0 });

    expect(insert).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    const [, item] = update.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(item).toMatchObject({ _id: 'a1', remaining: 0, threshold: 2 });
    expect(item.updatedDate).toBeInstanceOf(Date);
    expect(alert._id).toBe('a1');
  });
});

describe('resolveAlert', () => {
  it('marks the alert resolved by id', async () => {
    update.mockResolvedValue({ _id: 'a1', status: 'resolved' });

    const alert = await resolveAlert('a1');

    const [collection, item] = update.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(collection).toBe(RESTOCK_ALERTS_COLLECTION);
    expect(item).toMatchObject({ _id: 'a1', status: 'resolved' });
    expect(alert.status).toBe('resolved');
  });
});
