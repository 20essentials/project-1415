import { orders } from '@wix/pricing-plans';
import { auth } from '@wix/essentials';

export interface ClubMembership {
  active: boolean;
  planName: string;
  status: string;
  endDate: Date | null;
}

interface ClubOrder {
  _id?: string;
  planId?: string;
  status?: string;
  planName?: string;
  endDate?: Date | null;
}

const listMemberOrders = auth.elevate(orders.managementListOrders) as (query?: {
  buyerIds?: string[];
  orderStatuses?: string[];
  limit?: number;
  offset?: number;
}) => Promise<{ orders?: ClubOrder[] }> | undefined;

export async function getMemberMembership(memberId: string): Promise<ClubMembership | null> {
  if (!memberId) return null;
  try {
    const result = await listMemberOrders({
      buyerIds: [memberId],
      orderStatuses: ['ACTIVE', 'PENDING'],
      limit: 50,
      offset: 0,
    });
    const activeOrder = (result?.orders ?? []).find(
      (order) => order.status === 'ACTIVE' || order.status === 'PENDING',
    );
    if (!activeOrder) return null;
    return {
      active: activeOrder.status === 'ACTIVE',
      planName: activeOrder.planName ?? '',
      status: activeOrder.status ?? '',
      endDate: activeOrder.endDate ? new Date(activeOrder.endDate) : null,
    };
  } catch (error) {
    console.error('[club] membership query failed:', error);
    return null;
  }
}

export async function isClubMember(memberId: string): Promise<boolean> {
  const membership = await getMemberMembership(memberId);
  return membership?.active === true;
}

export type GuideAccess = 'open' | 'locked';

export function guideAccessState(premium: boolean, memberActive: boolean): GuideAccess {
  return premium && !memberActive ? 'locked' : 'open';
}
