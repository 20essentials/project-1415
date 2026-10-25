import { plansV3 } from '@wix/pricing-plans';
import { auth } from '@wix/essentials';

export interface ClubPlan {
  id: string;
  name: string;
  description: string;
  price: {
    amount: number;
    formattedAmount: string;
    currency: string | null;
  };
  billingCycle: 'MONTH' | 'YEAR' | 'ONE_TIME' | null;
  perks: string[];
}

interface VariantBillingTerms {
  billingCycle?: { period?: string; count?: string };
}

interface PlanRecord {
  _id?: string;
  name?: string;
  description?: string | null;
  currency?: string | null;
  perks?: { description?: string }[];
  pricingVariants?: {
    pricingStrategies?: { flatRate?: { amount?: string } }[];
    billingTerms?: VariantBillingTerms;
  }[];
}

interface PlansQuery {
  eq(field: string, value: string): PlansQuery;
  limit(count: number): PlansQuery;
  find(): Promise<{ items?: PlanRecord[] }>;
}

const queryPlansElevated = auth.elevate(plansV3.queryPlans) as (query?: never) => PlansQuery;

function formatAmount(amount: number, currency: string | null, locale: string): string {
  if (!currency) return amount.toLocaleString(locale);
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function toCycle(terms: VariantBillingTerms | undefined): ClubPlan['billingCycle'] {
  const period = terms?.billingCycle?.period;
  if (period === 'MONTH') return 'MONTH';
  if (period === 'YEAR') return 'YEAR';
  return 'ONE_TIME';
}

function toClubPlan(record: PlanRecord, locale: string): ClubPlan | null {
  const variant = record.pricingVariants?.[0];
  const amount = variant?.pricingStrategies?.[0]?.flatRate?.amount;
  if (!record._id || amount === undefined || !Number.isFinite(Number(amount))) return null;
  const value = Number(amount);
  return {
    id: record._id,
    name: record.name ?? '',
    description: record.description ?? '',
    price: {
      amount: value,
      formattedAmount: formatAmount(value, record.currency ?? null, locale),
      currency: record.currency ?? null,
    },
    billingCycle: toCycle(variant?.billingTerms),
    perks: (record.perks ?? []).map((perk) => perk.description ?? '').filter((perk) => perk.length > 0),
  };
}

const CYCLE_ORDER: Record<NonNullable<ClubPlan['billingCycle']>, number> = {
  MONTH: 0,
  YEAR: 1,
  ONE_TIME: 2,
};

export async function listClubPlans(locale: string = 'en'): Promise<ClubPlan[]> {
  try {
    const result = await queryPlansElevated().eq('visibility', 'PUBLIC').limit(20).find();
    const plans = (result.items ?? [])
      .map((record) => toClubPlan(record, locale))
      .filter((plan): plan is ClubPlan => plan !== null);
    return plans.sort((a, b) => CYCLE_ORDER[a.billingCycle ?? 'MONTH'] - CYCLE_ORDER[b.billingCycle ?? 'MONTH']);
  } catch (error) {
    console.error('[club] plans query failed:', error);
    return [];
  }
}

export async function getClubPlanById(id: string): Promise<ClubPlan | null> {
  if (!id) return null;
  try {
    const result = await queryPlansElevated().eq('_id', id).limit(1).find();
    const record = result.items?.[0];
    return record ? toClubPlan(record, 'en') : null;
  } catch (error) {
    console.error('[club] plan lookup failed:', error);
    return null;
  }
}
