import { describe, expect, it, vi, beforeEach } from 'vitest';
import { plansV3 } from '@wix/pricing-plans';
import { auth } from '@wix/essentials';
import { listClubPlans, getClubPlanById } from '@/features/club/plans';

vi.mock('@wix/pricing-plans', () => ({
  plansV3: {
    queryPlans: vi.fn(),
  },
}));

vi.mock('@wix/essentials', () => ({
  auth: {
    elevate: (fn: unknown) => fn,
  },
}));

const monthlyRaw = {
  _id: 'plan-monthly',
  name: 'Plant Parent Club — Monthly',
  description: 'Ongoing membership.',
  currency: 'EUR',
  perks: [{ description: 'Premium care guides' }, { description: '' }],
  pricingVariants: [{
    pricingStrategies: [{ flatRate: { amount: '9.00' } }],
    billingTerms: { billingCycle: { period: 'MONTH', count: '1' }, endType: 'UNTIL_CANCELLED' },
  }],
};

const annualRaw = {
  _id: 'plan-annual',
  name: 'Plant Parent Club — Annual',
  description: 'A full year.',
  currency: 'EUR',
  perks: [{ description: 'Premium care guides' }],
  pricingVariants: [{
    pricingStrategies: [{ flatRate: { amount: '90.00' } }],
    billingTerms: { billingCycle: { period: 'YEAR', count: '1' }, endType: 'CYCLES_COMPLETED' },
  }],
};

describe('listClubPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.elevate as any) = (fn: any) => fn;
  });

  it('queries PUBLIC plans with limit 20', async () => {
    (plansV3.queryPlans as any).mockReturnValue({
      eq: () => ({
          limit: () => ({
            find: () => Promise.resolve({ items: [monthlyRaw] }),
          }),
      }),
    });
    const plans = await listClubPlans('en');
    expect(plans).toHaveLength(1);
    expect(plans[0].price.formattedAmount).toContain('9');
    expect(plans[0].price.currency).toBe('EUR');
    expect(plans[0].billingCycle).toBe('MONTH');
    expect(plans[0].perks).toEqual(['Premium care guides']);
  });

  it('orders MONTH before YEAR', async () => {
    (plansV3.queryPlans as any).mockReturnValue({
      eq: () => ({
        limit: () => ({
          find: () => Promise.resolve({ items: [annualRaw, monthlyRaw] }),
        }),
      }),
    });
    const plans = await listClubPlans();
    expect(plans.map((p) => p.billingCycle)).toEqual(['MONTH', 'YEAR']);
  });

  it('drops malformed plans without a numeric price', async () => {
    (plansV3.queryPlans as any).mockReturnValue({
      eq: () => ({
        limit: () => ({
          find: () => Promise.resolve({ items: [{ ...monthlyRaw, pricingVariants: [{ pricingStrategies: [{ flatRate: {} }] }] }] }),
        }),
      }),
    });
    const plans = await listClubPlans();
    expect(plans).toEqual([]);
  });

  it('returns [] on a failed query', async () => {
    (plansV3.queryPlans as any).mockImplementation(() => {
      throw new Error('SDK down');
    });
    const plans = await listClubPlans('en');
    expect(plans).toEqual([]);
  });
});

describe('getClubPlanById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.elevate as any) = (fn: any) => fn;
  });

  it('returns the plan when the id matches', async () => {
    (plansV3.queryPlans as any).mockReturnValue({
      eq: (field: string, value: string) => {
        if (field !== '_id' || value !== 'plan-annual') {
          throw new Error('expected filter id plan-annual, got ' + field);
        }
        return {
          limit: () => ({
            find: () => Promise.resolve({ items: [annualRaw] }),
          }),
        };
      },
    });
    const plan = await getClubPlanById('plan-annual');
    expect(plan?.id).toBe('plan-annual');
    expect(plan?.billingCycle).toBe('YEAR');
  });

  it('returns null on an unknown id', async () => {
    (plansV3.queryPlans as any).mockReturnValue({
      eq: () => ({
        limit: () => ({
          find: () => Promise.resolve({ items: [] }),
        }),
      }),
    });
    expect(await getClubPlanById('plan-unknown')).toBeNull();
  });

  it('returns null on a failed lookup', async () => {
    (plansV3.queryPlans as any).mockReturnValue({
      eq: () => ({
        limit: () => ({
          find: () => Promise.reject(new Error('down')),
        }),
      }),
    });
    expect(await getClubPlanById('plan-annual')).toBeNull();
  });
});
