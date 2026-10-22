import { orders } from '@wix/ecom';
import { inventoryItemsV3, productsV3 } from '@wix/stores';
import {
  isLowStock,
  lowStockThreshold,
} from '../../../../features/restock-alerts/restock-alert';
import { upsertAlert } from '../../../../features/restock-alerts/restock-alerts-repository';

const WIX_STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e';

function collectProductIds(
  lineItems: NonNullable<NonNullable<orders.OrderApproved['order']>['lineItems']>,
): string[] {
  const ids = new Set<string>();
  for (const lineItem of lineItems) {
    if (lineItem.catalogReference?.appId !== WIX_STORES_APP_ID) continue;
    const productId = lineItem.catalogReference.catalogItemId;
    if (productId) ids.add(productId);
  }
  return [...ids];
}

async function slugsByProductId(productIds: string[]): Promise<Map<string, string>> {
  const byId = new Map<string, string>();
  if (productIds.length === 0) return byId;
  try {
    const result = await productsV3
      .queryProducts()
      .in('_id', productIds)
      .limit(100)
      .find();
    for (const product of result.items ?? []) {
      if (product._id && product.slug) byId.set(product._id, product.slug);
    }
  } catch (error) {
    console.error('[restock-alerts] product slug query failed:', error);
  }
  return byId;
}

async function remainingForProduct(productId: string): Promise<number> {
  const result = await inventoryItemsV3
    .queryInventoryItems()
    .eq('productId', productId)
    .limit(100)
    .find();
  const items = result.items ?? [];
  if (items.length === 0) return 0;
  let sum = 0;
  for (const item of items) {
    if (item.trackQuantity === false) return Number.POSITIVE_INFINITY;
    sum += Math.max(item.quantity ?? 0, 0);
  }
  return sum;
}

export default orders.onOrderApproved(async (event) => {
  const order = event.data.order;
  const orderId = order?._id;
  if (!orderId || !order?.lineItems?.length) return;

  const productIds = collectProductIds(order.lineItems);
  const slugs = await slugsByProductId(productIds);
  const threshold = lowStockThreshold(null);

  for (const productId of productIds) {
    try {
      const remaining = await remainingForProduct(productId);
      if (!Number.isFinite(remaining) || !isLowStock(remaining, threshold)) continue;
      await upsertAlert({
        orderId,
        productId,
        slug: slugs.get(productId),
        remaining,
        threshold,
      });
    } catch (error) {
      console.error(`[restock-alerts] failed for product "${productId}":`, error);
    }
  }
});
