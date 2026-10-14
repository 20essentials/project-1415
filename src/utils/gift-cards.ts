import { httpClient } from '@wix/essentials';

// App id observed on installed sites (not in the public registry). If Wix rotates
// it, the probe and the buy flow fail together and the surfaces hide gracefully.
export const WIX_GIFT_CARDS_APP_ID = 'd80111c5-a0f4-47a8-b63a-65b54d774a27';

const ENDPOINT = 'https://www.wixapis.com/gift-cards/v1/gift-card-products/query';

export interface GiftCardImage {
  id?: string;
  url?: string;
  height?: number;
  width?: number;
  altText?: string;
}

export interface GiftCardPresetVariant {
  id: string;
  price: { amount: string; formattedAmount: string };
  value: { amount: string; formattedAmount: string };
}

export interface GiftCardProduct {
  id: string;
  revision?: string;
  name: string;
  description: string;
  image?: GiftCardImage;
  expirationType?: string;
  presetVariants: GiftCardPresetVariant[];
}

// The JS SDK's gift-vouchers package only exposes redemption, so the dashboard's
// eGift Card template is queried through REST. Module-level memoization coalesces
// the nav, home and page probes of a single request into one fetch.
let cached: Promise<GiftCardProduct | null> | null = null;

export async function getGiftCardProduct(): Promise<GiftCardProduct | null> {
  if (cached) return cached;
  cached = (async () => {
    try {
      const res = await httpClient.fetchWithAuth(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: { paging: { limit: 1 } } }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const products = data?.giftCardProducts;
      if (!Array.isArray(products) || products.length === 0) return null;
      return products[0] as GiftCardProduct;
    } catch (error) {
      console.error('[gift-cards] gift card product query failed:', error);
      return null;
    }
  })();
  return cached;
}
