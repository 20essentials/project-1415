import { describe, expect, it, vi, beforeEach } from 'vitest';
import { orders } from '@wix/pricing-plans';
import { auth } from '@wix/essentials';
import { getMemberMembership, isClubMember, guideAccessState } from '@/features/club/membership';

vi.mock('@wix/pricing-plans', () => ({
  orders: {
    managementListOrders: vi.fn(),
  },
}));

vi.mock('@wix/essentials', () => ({
  auth: {
    elevate: (fn: unknown) => fn,
  },
}));

describe('getMemberMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.elevate as any) = (fn: any) => fn;
  });

  it('sends the member id and both statuses and reads an ACTIVE order', async () => {
    (orders.managementListOrders as any).mockImplementation((options: {
      buyerIds?: string[];
      orderStatuses?: string[];
      limit?: number;
    }) => {
      expect(options.buyerIds).toEqual(['member-1']);
      expect(options.orderStatuses).toEqual(['ACTIVE', 'PENDING']);
      expect(options.limit).toBe(50);
      return Promise.resolve({
        orders: [{ _id: 'o-1', planId: 'p-1', status: 'ACTIVE', planName: 'Plant Parent Club — Monthly' }],
      });
    });
    const membership = await getMemberMembership('member-1');
    expect(membership).toEqual({
      active: true,
      planName: 'Plant Parent Club — Monthly',
      status: 'ACTIVE',
      endDate: null,
    });
  });

  it('marks a PENDING order as not yet active', async () => {
    (orders.managementListOrders as any).mockResolvedValue({
      orders: [{ _id: 'o-2', planId: 'p-1', status: 'PENDING', planName: 'Annual', endDate: '2026-01-01T00:00:00Z' }],
    });
    const membership = await getMemberMembership('member-1');
    expect(membership?.active).toBe(false);
    expect(membership?.planName).toBe('Annual');
    expect(membership?.endDate?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns null when the member has no orders', async () => {
    (orders.managementListOrders as any).mockResolvedValue({ orders: [] });
    expect(await getMemberMembership('member-1')).toBeNull();
  });

  it('returns null without a member id', async () => {
    expect(await getMemberMembership('')).toBeNull();
    expect(orders.managementListOrders).not.toHaveBeenCalled();
  });

  it('returns null when the orders read throws', async () => {
    (orders.managementListOrders as any).mockImplementation(() => {
      throw new Error('SDK down');
    });
    expect(await getMemberMembership('member-1')).toBeNull();
  });
});

describe('isClubMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.elevate as any) = (fn: any) => fn;
  });

  it('is true only for an ACTIVE order', async () => {
    (orders.managementListOrders as any).mockResolvedValue({
      orders: [{ _id: 'o-1', planId: 'p-1', status: 'ACTIVE' }],
    });
    expect(await isClubMember('member-1')).toBe(true);

    (orders.managementListOrders as any).mockResolvedValue({
      orders: [{ _id: 'o-2', planId: 'p-1', status: 'PENDING' }],
    });
    expect(await isClubMember('member-1')).toBe(false);
  });
});

describe('guideAccessState', () => {
  it('locks premium guides for non-members', () => {
    expect(guideAccessState(true, false)).toBe('locked');
  });

  it('opens premium guides for members', () => {
    expect(guideAccessState(true, true)).toBe('open');
  });

  it('opens free guides for everyone', () => {
    expect(guideAccessState(false, false)).toBe('open');
    expect(guideAccessState(false, true)).toBe('open');
  });
});
