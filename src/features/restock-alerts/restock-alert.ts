export type RestockAlertStatus = 'pending' | 'resolved';

export interface RestockAlert {
  _id: string;
  orderId: string;
  productId: string;
  slug?: string;
  remaining: number;
  threshold: number;
  status: RestockAlertStatus;
  createdDate?: string;
  updatedDate?: string;
}

export interface RestockAlertDraft {
  orderId: string;
  productId: string;
  slug?: string;
  remaining: number;
  threshold: number;
}

export const DEFAULT_LOW_STOCK_THRESHOLD = 2;

export function lowStockThreshold(threshold: number | null | undefined): number {
  return typeof threshold === 'number' && Number.isFinite(threshold) && threshold >= 0
    ? threshold
    : DEFAULT_LOW_STOCK_THRESHOLD;
}

export function isLowStock(remaining: number, threshold: number): boolean {
  return remaining <= threshold;
}

export function alertKey(orderId: string, productId: string): string {
  return `${orderId}::${productId}`;
}
