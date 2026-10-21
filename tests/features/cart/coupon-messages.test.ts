import { describe, expect, it } from 'vitest';
import { couponErrorCode, couponErrorMessage } from '@/features/cart/coupon-messages';

describe('coupon-messages', () => {
  it('maps invalid codes', () => {
    expect(couponErrorCode({ details: { applicationError: { code: 'INVALID_COUPON_CODE' } } })).toBe('INVALID_COUPON_CODE');
    expect(couponErrorCode({ details: { applicationError: { code: 'COUPON_NOT_FOUND' } } })).toBe('INVALID_COUPON_CODE');
    expect(couponErrorCode({ details: { applicationError: { code: 'COUPON_NOT_VALID' } } })).toBe('INVALID_COUPON_CODE');
  });

  it('maps other codes', () => {
    expect(couponErrorCode({ details: { applicationError: { code: 'COUPON_NOT_FOUND_IN_CART' } } })).toBe('COUPON_NOT_FOUND_IN_CART');
    expect(couponErrorCode({ details: { applicationError: { code: 'COUPON_ALREADY_EXISTS' } } })).toBe('COUPON_ALREADY_EXISTS');
    expect(couponErrorCode({ details: { applicationError: { code: 'INVALID_COUPON_STATUS' } } })).toBe('INVALID_COUPON_STATUS');
    expect(couponErrorCode({ details: { applicationError: { code: 'COUPON_GIFT_CARD' } } })).toBe('COUPON_GIFT_CARD');
    expect(couponErrorCode({ details: { applicationError: { code: 'COUPON_NOT_APPLICABLE_TO_GIFT_CARDS' } } })).toBe('COUPON_GIFT_CARD');
  });

  it('handles network and unknown', () => {
    expect(couponErrorCode(new Error('network error'))).toBe('NETWORK');
    expect(couponErrorCode({})).toBe('UNKNOWN');
    expect(couponErrorCode(null)).toBe('UNKNOWN');
  });

  it('returns correct messages', () => {
    const msgs = {
      invalid: 'invalid',
      expired: 'expired',
      already: 'already',
      giftCard: 'gift',
      network: 'net',
      unknown: 'unk',
    };
    expect(couponErrorMessage('INVALID_COUPON_CODE', msgs)).toBe('invalid');
    expect(couponErrorMessage('COUPON_NOT_FOUND_IN_CART', msgs)).toBe('invalid');
    expect(couponErrorMessage('COUPON_ALREADY_EXISTS', msgs)).toBe('already');
    expect(couponErrorMessage('INVALID_COUPON_STATUS', msgs)).toBe('expired');
    expect(couponErrorMessage('COUPON_GIFT_CARD', msgs)).toBe('gift');
    expect(couponErrorMessage('NETWORK', msgs)).toBe('net');
    expect(couponErrorMessage('UNKNOWN', msgs)).toBe('unk');
  });
});
