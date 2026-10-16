import { orders } from '@wix/ecom';
import { auth } from '@wix/essentials';
import type { Order, OrderLineItem, OrderSearch, Price, SearchOrdersResponse } from '@wix/auto_sdk_ecom_orders';

export interface MemberOrderPrice {
  amount: string | null;
  formattedAmount: string | null;
}

export interface MemberOrderLineItem {
  title: string;
  quantity: number;
  image: string | null;
}

export interface MemberOrderSummary {
  id: string;
  orderNumber: string;
  createdDate: Date | null;
  status: string;
  paymentStatus: string;
  currency: string | null;
  buyerEmail: string | null;
  priceSummary: {
    subtotal: MemberOrderPrice | null;
    shipping: MemberOrderPrice | null;
    tax: MemberOrderPrice | null;
    discount: MemberOrderPrice | null;
    total: MemberOrderPrice | null;
  };
  lineItems: MemberOrderLineItem[];
}

const ORDER_LIMIT = 20;

const searchOrdersElevated = auth.elevate(orders.searchOrders);

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPrice(price: Price | null | undefined): MemberOrderPrice | null {
  if (!price) return null;
  return { amount: price.amount ?? null, formattedAmount: price.formattedAmount ?? null };
}

function toLineItem(item: OrderLineItem): MemberOrderLineItem {
  return {
    title: item.productName?.original ?? item.productName?.translated ?? '',
    quantity: item.quantity ?? 0,
    image: item.image ?? null,
  };
}

function toSummary(order: Order): MemberOrderSummary {
  const summary = order.priceSummary;
  return {
    id: order._id ?? '',
    orderNumber: order.number ?? '',
    createdDate: toDate(order._createdDate),
    status: order.status ?? '',
    paymentStatus: order.paymentStatus ?? '',
    currency: order.currency ?? null,
    buyerEmail: order.buyerInfo?.email ?? null,
    priceSummary: {
      subtotal: toPrice(summary?.subtotal),
      shipping: toPrice(summary?.shipping),
      tax: toPrice(summary?.tax),
      discount: toPrice(summary?.discount),
      total: toPrice(summary?.total),
    },
    lineItems: (order.lineItems ?? []).map(toLineItem),
  };
}

export async function listMemberOrders(memberEmail: string): Promise<MemberOrderSummary[]> {
  const email = memberEmail.trim();
  if (!email) return [];

  // `searchOrders` es admin-level: queda elevado aquí y nunca cruza a un cliente.
  // El email sale siempre de `members.getCurrentMember`, nunca de params del request.
  // El campo sortable es `_createdDate` (spec `OrderSearchSpec.wql`); `createdDate`
  // ni siquiera está en el union de `sort`, aunque la API lo responde con 200.
  const search: OrderSearch = {
    filter: { 'buyerInfo.email': { $eq: email } },
    sort: [{ fieldName: '_createdDate', order: 'DESC' }],
    cursorPaging: { limit: ORDER_LIMIT },
  };

  try {
    const result: SearchOrdersResponse = await searchOrdersElevated(search);
    return (result.orders ?? []).map(toSummary).filter((order) => order.id.length > 0);
  } catch (error) {
    console.error('[order-history] member orders query failed:', error);
    return [];
  }
}
