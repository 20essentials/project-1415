import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { productsV3 } from '@wix/stores';
import type { V3Product } from '@wix/auto_sdk_stores_products-v-3';

export interface WishlistItem {
  _id: string;
  productId: string;
  slug?: string;
  createdDate?: string;
}

interface WishlistRecord {
  _id?: string;
  memberId?: string;
  productId?: string;
  slug?: string;
  createdDate?: Date | string;
}

interface WishlistQuery {
  eq(field: string, value: string): WishlistQuery;
  descending(field: string): WishlistQuery;
  limit(count: number): WishlistQuery;
  find(): Promise<{ items?: WishlistRecord[] }>;
}

const COLLECTION = 'wishlist';

const queryWishlistElevated = auth.elevate(items.query) as (collectionId: string) => WishlistQuery;
const insertWishlistElevated = auth.elevate(items.insert) as (
  collectionId: string,
  item: WishlistRecord,
) => Promise<WishlistRecord>;
const removeWishlistElevated = auth.elevate(items.remove) as (
  collectionId: string,
  itemId: string,
) => Promise<WishlistRecord | null>;

function toIso(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toItem(record: WishlistRecord): WishlistItem {
  return {
    _id: record._id ?? '',
    productId: record.productId ?? '',
    slug: record.slug,
    createdDate: toIso(record.createdDate),
  };
}

export async function listWishlist(memberId: string): Promise<WishlistItem[]> {
  if (!memberId) return [];
  try {
    const result = await queryWishlistElevated(COLLECTION)
      .eq('memberId', memberId)
      .descending('createdDate')
      .limit(100)
      .find();
    return (result.items ?? [])
      .map(toItem)
      .filter((item) => item._id.length > 0 && item.productId.length > 0);
  } catch (error) {
    console.error('[wishlist] list failed:', error);
    return [];
  }
}

// Saved products, kept in wishlist order (most recent first).
export async function listWishlistProducts(memberId: string, limit = 24): Promise<V3Product[]> {
  const saved = await listWishlist(memberId);
  const ids = saved.map((item) => item.productId).slice(0, limit);
  if (ids.length === 0) return [];
  try {
    const result = await productsV3
      .queryProducts({ fields: ['CURRENCY', 'MIN_PRICE_VARIANT', 'DISCOUNT_INFO'] })
      .in('_id', ids)
      .limit(limit)
      .find();
    const byId = new Map((result.items ?? []).map((product) => [product._id, product]));
    return ids
      .map((id) => byId.get(id))
      .filter((product): product is V3Product => Boolean(product));
  } catch (error) {
    console.error('[wishlist] products query failed:', error);
    return [];
  }
}

export async function isWished(memberId: string, productId: string): Promise<boolean> {
  if (!memberId || !productId) return false;
  try {
    const result = await queryWishlistElevated(COLLECTION)
      .eq('memberId', memberId)
      .eq('productId', productId)
      .limit(1)
      .find();
    return (result.items ?? []).length > 0;
  } catch (error) {
    console.error('[wishlist] lookup failed:', error);
    return false;
  }
}

export async function addToWishlist(
  memberId: string,
  product: { productId: string; slug?: string },
): Promise<void> {
  if (!memberId || !product.productId) return;
  if (await isWished(memberId, product.productId)) return;
  try {
    await insertWishlistElevated(COLLECTION, {
      memberId,
      productId: product.productId,
      slug: product.slug,
      createdDate: new Date(),
    });
  } catch (error) {
    console.error('[wishlist] add failed:', error);
  }
}

export async function removeFromWishlist(memberId: string, productId: string): Promise<void> {
  if (!memberId || !productId) return;
  try {
    const result = await queryWishlistElevated(COLLECTION)
      .eq('memberId', memberId)
      .eq('productId', productId)
      .limit(100)
      .find();
    for (const record of result.items ?? []) {
      if (record._id) await removeWishlistElevated(COLLECTION, record._id);
    }
  } catch (error) {
    console.error('[wishlist] remove failed:', error);
  }
}
