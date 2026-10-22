import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import type { RestockAlert, RestockAlertDraft, RestockAlertStatus } from './restock-alert';

interface RestockAlertRecord {
  _id?: string;
  orderId?: string;
  productId?: string;
  slug?: string;
  remaining?: number;
  threshold?: number;
  status?: string;
  createdDate?: Date | string;
  updatedDate?: Date | string;
}

interface RestockAlertQuery {
  eq(field: string, value: string): RestockAlertQuery;
  ascending(field: string): RestockAlertQuery;
  descending(field: string): RestockAlertQuery;
  limit(count: number): RestockAlertQuery;
  find(): Promise<{ items?: RestockAlertRecord[] }>;
}

export const RESTOCK_ALERTS_COLLECTION = '@d960960gm/petals-pre-983314f4/restock-alerts';

const queryElevated = auth.elevate(items.query) as (collectionId: string) => RestockAlertQuery;
const insertElevated = auth.elevate(items.insert) as (
  collectionId: string,
  item: RestockAlertRecord,
) => Promise<RestockAlertRecord>;
const updateElevated = auth.elevate(items.update) as (
  collectionId: string,
  item: RestockAlertRecord & { _id: string },
) => Promise<RestockAlertRecord>;

function toIso(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toStatus(value: string | undefined): RestockAlertStatus {
  return value === 'resolved' ? 'resolved' : 'pending';
}

function toAlert(record: RestockAlertRecord): RestockAlert {
  return {
    _id: record._id ?? '',
    orderId: record.orderId ?? '',
    productId: record.productId ?? '',
    slug: record.slug,
    remaining: record.remaining ?? 0,
    threshold: record.threshold ?? 0,
    status: toStatus(record.status),
    createdDate: toIso(record.createdDate),
    updatedDate: toIso(record.updatedDate),
  };
}

export async function findAlert(orderId: string, productId: string): Promise<RestockAlert | null> {
  const result = await queryElevated(RESTOCK_ALERTS_COLLECTION)
    .eq('orderId', orderId)
    .eq('productId', productId)
    .limit(1)
    .find();
  const record = (result.items ?? [])[0];
  return record ? toAlert(record) : null;
}

export async function listAlerts(status?: RestockAlertStatus): Promise<RestockAlert[]> {
  const base = queryElevated(RESTOCK_ALERTS_COLLECTION);
  const filtered = status ? base.eq('status', status) : base;
  const result = await filtered.descending('createdDate').limit(100).find();
  return (result.items ?? [])
    .map(toAlert)
    .filter((alert) => alert._id.length > 0);
}

export async function upsertAlert(draft: RestockAlertDraft): Promise<RestockAlert> {
  const existing = await findAlert(draft.orderId, draft.productId);
  const now = new Date();
  if (existing) {
    const updated = await updateElevated(RESTOCK_ALERTS_COLLECTION, {
      _id: existing._id,
      remaining: draft.remaining,
      threshold: draft.threshold,
      slug: draft.slug,
      updatedDate: now,
    });
    return toAlert(updated);
  }
  const created = await insertElevated(RESTOCK_ALERTS_COLLECTION, {
    orderId: draft.orderId,
    productId: draft.productId,
    slug: draft.slug,
    remaining: draft.remaining,
    threshold: draft.threshold,
    status: 'pending',
    createdDate: now,
    updatedDate: now,
  });
  return toAlert(created);
}

export async function resolveAlert(alertId: string): Promise<RestockAlert> {
  const updated = await updateElevated(RESTOCK_ALERTS_COLLECTION, {
    _id: alertId,
    status: 'resolved',
    updatedDate: new Date(),
  });
  return toAlert(updated);
}
