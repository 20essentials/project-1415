import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  alertKey,
  isLowStock,
  lowStockThreshold,
} from '@/features/restock-alerts/restock-alert';

describe('lowStockThreshold', () => {
  it('keeps a valid non-negative threshold', () => {
    expect(lowStockThreshold(5)).toBe(5);
    expect(lowStockThreshold(0)).toBe(0);
  });

  it('falls back to the default for missing or invalid values', () => {
    expect(lowStockThreshold(null)).toBe(DEFAULT_LOW_STOCK_THRESHOLD);
    expect(lowStockThreshold(undefined)).toBe(DEFAULT_LOW_STOCK_THRESHOLD);
    expect(lowStockThreshold(-1)).toBe(DEFAULT_LOW_STOCK_THRESHOLD);
    expect(lowStockThreshold(Number.NaN)).toBe(DEFAULT_LOW_STOCK_THRESHOLD);
  });
});

describe('isLowStock', () => {
  it('is true when remaining is at or below the threshold', () => {
    expect(isLowStock(0, 2)).toBe(true);
    expect(isLowStock(2, 2)).toBe(true);
  });

  it('is false when remaining is above the threshold', () => {
    expect(isLowStock(3, 2)).toBe(false);
  });
});

describe('alertKey', () => {
  it('joins order and product into a stable idempotency key', () => {
    expect(alertKey('o1', 'p1')).toBe('o1::p1');
    expect(alertKey('o1', 'p2')).not.toBe(alertKey('o1', 'p1'));
  });
});
