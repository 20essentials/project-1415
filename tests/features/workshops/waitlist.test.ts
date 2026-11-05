import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WaitlistJoinError,
  findWaitlistEntry,
  joinWaitlist,
  listWaitlistEntries,
} from '@/features/workshops/waitlist';

const query = vi.fn();
const insert = vi.fn();

vi.mock('@wix/data', () => ({
  items: {
    query: (...args: unknown[]) => query(...args),
    insert: (...args: unknown[]) => insert(...args),
  },
}));

vi.mock('@wix/essentials', () => ({
  auth: { elevate: (fn: unknown) => fn },
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
  builder.calls = calls;
  for (const method of ['eq', 'ascending', 'limit']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.find = () => {
    calls.push({ method: 'find', args: [] });
    return Promise.resolve(result);
  };
  return builder;
}

const VALID_INPUT = {
  workshopId: 'svc-1',
  workshopName: 'Care 101',
  sessionStart: '2026-11-20T10:00:00',
  firstName: 'Bee',
  email: 'bee@example.com',
};

beforeEach(() => {
  query.mockReset();
  insert.mockReset();
  query.mockImplementation(() => makeBuilder());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('joinWaitlist', () => {
  it('inserts a waiting-list entry with status waiting and a normalized email', async () => {
    query.mockImplementation(() => makeBuilder({ items: [] }));
    insert.mockResolvedValue({
      _id: 'entry-1',
      workshopId: 'svc-1',
      workshopName: 'Care 101',
      sessionStart: '2026-11-20T10:00:00',
      firstName: 'Bee',
      email: 'bee@example.com',
      status: 'waiting',
      createdDate: new Date('2026-11-05T10:00:00Z'),
    });

    const entry = await joinWaitlist({ ...VALID_INPUT, email: 'Bee@Example.com ' });

    expect(entry).toMatchObject({ id: 'entry-1', status: 'waiting', email: 'bee@example.com' });
    expect(entry.createdDate).toBe('2026-11-05T10:00:00.000Z');
    expect(insert).toHaveBeenCalledWith(
      'workshop-waitlist',
      expect.objectContaining({
        workshopId: 'svc-1',
        sessionStart: '2026-11-20T10:00:00',
        firstName: 'Bee',
        email: 'bee@example.com',
        status: 'waiting',
      }),
    );
  });

  it('accepts a date-only session key for sold-out days', async () => {
    query.mockImplementation(() => makeBuilder({ items: [] }));
    insert.mockResolvedValue({ _id: 'entry-2', status: 'waiting' });

    const entry = await joinWaitlist({ ...VALID_INPUT, sessionStart: '2026-11-29' });

    expect(entry.id).toBe('entry-2');
    expect(insert).toHaveBeenCalledWith(
      'workshop-waitlist',
      expect.objectContaining({ sessionStart: '2026-11-29' }),
    );
  });

  it('rejects duplicates for the same session and email', async () => {
    query.mockImplementation(() =>
      makeBuilder({
        items: [{ _id: 'entry-1', status: 'waiting', sessionStart: '2026-11-20T10:00:00' }],
      }),
    );

    await expect(joinWaitlist(VALID_INPUT)).rejects.toMatchObject({
      code: 'ALREADY_LISTED',
      name: 'WaitlistJoinError',
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it('maps malformed input to INVALID_INPUT without touching Wix', async () => {
    for (const bad of [
      { ...VALID_INPUT, workshopId: '' },
      { ...VALID_INPUT, sessionStart: 'not-a-date' },
      { ...VALID_INPUT, firstName: '   ' },
      { ...VALID_INPUT, email: 'nope' },
    ]) {
      const error = await joinWaitlist(bad).catch((candidate) => candidate);
      expect(error).toBeInstanceOf(WaitlistJoinError);
      expect((error as WaitlistJoinError).code).toBe('INVALID_INPUT');
    }
    expect(query).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('maps a failed insert to UNAVAILABLE', async () => {
    query.mockImplementation(() => makeBuilder({ items: [] }));
    insert.mockRejectedValue(new Error('Wix down'));

    await expect(joinWaitlist(VALID_INPUT)).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  });
});

describe('listWaitlistEntries', () => {
  it('returns waiting-first FIFO entries with ids', async () => {
    const builder = makeBuilder({
      items: [
        { _id: 'e-2', firstName: 'Bee', status: 'waiting', sessionStart: '2026-11-20T10:00:00' },
        { _id: 'e-1', firstName: 'Ana', status: 'notified' },
      ],
    });
    query.mockImplementation(() => builder);

    const entries = await listWaitlistEntries('2026-11-20T10:00:00');

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.id)).toEqual(['e-2', 'e-1']);
    expect(entries[1].status).toBe('notified');
    expect(builder.calls.map((call) => call.method)).toEqual(['eq', 'ascending', 'limit', 'find']);
  });
});

describe('findWaitlistEntry', () => {
  it('queries by workshop, session and email', async () => {
    const builder = makeBuilder({ items: [{ _id: 'e-1', email: 'bee@example.com' }] });
    query.mockImplementation(() => builder);

    const entry = await findWaitlistEntry('svc-1', '2026-11-20T10:00:00', 'Bee@example.com');

    expect(entry?.id).toBe('e-1');
    expect(builder.calls.map((call) => call.method)).toEqual(['eq', 'eq', 'eq', 'limit', 'find']);
    expect(builder.calls[2].args).toEqual(['email', 'bee@example.com']);
  });
});
