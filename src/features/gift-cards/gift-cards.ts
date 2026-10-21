import { queryGiftCardProducts } from '@wix/auto_sdk_gift-vouchers_gift-voucher-products';
import type {
  GiftCardProduct as SdkGiftCardProduct,
  MultiCurrencyPrice,
  PresetVariant as SdkPresetVariant,
} from '@wix/auto_sdk_gift-vouchers_gift-voucher-products';
import { resolveWixImage } from '@/shared/wix-image';

// App id observed on installed sites (not in the public registry). If Wix rotates
// it, the probe and the buy flow fail together and the surfaces hide gracefully.
export const WIX_GIFT_CARDS_APP_ID = 'd80111c5-a0f4-47a8-b63a-65b54d774a27';

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

// A site supports a single gift card product, so the first one is the only one.
const PRODUCT_LIMIT = 1;

function toAmount(price: MultiCurrencyPrice | undefined): { amount: string; formattedAmount: string } {
  const amount = price?.amount ?? '0';
  return { amount, formattedAmount: price?.formattedAmount ?? amount };
}

function toPresetVariant(variant: SdkPresetVariant): GiftCardPresetVariant | null {
  if (!variant._id) return null;
  return {
    id: variant._id,
    price: toAmount(variant.price),
    value: toAmount(variant.value ?? variant.price),
  };
}

function toGiftCardProduct(product: SdkGiftCardProduct): GiftCardProduct | null {
  if (!product._id || !product.name) return null;
  const image = product.image ? resolveWixImage(product.image) : null;
  return {
    id: product._id,
    revision: product.revision ?? undefined,
    name: product.name,
    description: product.description ?? '',
    image: image ? { url: image.url, width: image.width, height: image.height } : undefined,
    expirationType: product.expirationType ?? undefined,
    presetVariants: (product.presetVariants ?? [])
      .map(toPresetVariant)
      .filter((variant): variant is GiftCardPresetVariant => variant !== null),
  };
}

// Module-level memoization coalesces the nav, home and page queries of a single
// request into one call. A failed query resolves to null and stays cached.
let cached: Promise<GiftCardProduct | null> | null = null;

export async function getGiftCardProduct(): Promise<GiftCardProduct | null> {
  if (cached) return cached;
  cached = (async () => {
    try {
      const result = await queryGiftCardProducts().limit(PRODUCT_LIMIT).find();
      const product = result.items?.[0];
      if (!product) return null;
      return toGiftCardProduct(product);
    } catch (error) {
      console.error('[gift-cards] gift card product query failed:', error);
      return null;
    }
  })();
  return cached;
}
