export type CouponErrorCode =
  | 'INVALID_COUPON_CODE'
  | 'COUPON_NOT_FOUND_IN_CART'
  | 'COUPON_ALREADY_EXISTS'
  | 'INVALID_COUPON_STATUS'
  | 'COUPON_GIFT_CARD'
  | 'NETWORK'
  | 'UNKNOWN';

export interface CouponMessages {
  invalid: string;
  expired: string;
  already: string;
  giftCard: string;
  network: string;
  unknown: string;
}

export function couponErrorCode(error: unknown): CouponErrorCode {
  if (error && typeof error === 'object') {
    const details = (error as any).details;
    const appErr = details && typeof details === 'object' ? details.applicationError : null;
    const code = appErr && typeof appErr === 'object' ? appErr.code : null;

    if (typeof code === 'string') {
      switch (code) {
        case 'INVALID_COUPON_CODE':
        case 'COUPON_NOT_FOUND':
        case 'COUPON_NOT_VALID':
          return 'INVALID_COUPON_CODE';
        case 'COUPON_NOT_FOUND_IN_CART':
          return 'COUPON_NOT_FOUND_IN_CART';
        case 'COUPON_ALREADY_EXISTS':
          return 'COUPON_ALREADY_EXISTS';
        case 'INVALID_COUPON_STATUS':
          return 'INVALID_COUPON_STATUS';
        case 'COUPON_GIFT_CARD':
        case 'COUPON_NOT_APPLICABLE_TO_GIFT_CARDS':
          return 'COUPON_GIFT_CARD';
        default:
          return 'UNKNOWN';
      }
    }
  }

  if (error instanceof Error) {
    const msg = error.message?.toLowerCase() ?? '';
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return 'NETWORK';
    }
  }

  return 'UNKNOWN';
}

export function couponErrorMessage(code: CouponErrorCode, messages: CouponMessages): string {
  switch (code) {
    case 'INVALID_COUPON_CODE':
      return messages.invalid;
    case 'COUPON_NOT_FOUND_IN_CART':
      return messages.invalid;
    case 'COUPON_ALREADY_EXISTS':
      return messages.already;
    case 'INVALID_COUPON_STATUS':
      return messages.expired;
    case 'COUPON_GIFT_CARD':
      return messages.giftCard;
    case 'NETWORK':
      return messages.network;
    case 'UNKNOWN':
    default:
      return messages.unknown;
  }
}

export function couponDiscount(
  cart: any,
  _couponIdOrCode?: string
): number | null {
  const summary = cart?.summary;
  const discounts = summary?.discounts;
  if (!Array.isArray(discounts)) return null;

  let total = 0;
  for (const d of discounts) {
    const amount = d?.discount?.amount;
    if (typeof amount === 'number' && Number.isFinite(amount)) {
      total += amount;
    }
  }
  if (total === 0) return 0;
  return total;
}
