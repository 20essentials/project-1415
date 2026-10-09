// Live discount rules + per-product matching (@wix/ecom primitive).
// Gotchas: queryDiscountRules needs auth.elevate(); scopes use `_id` not `id`;
// an "all products" scope has an empty catalogItemIds + a catalogAppId.
import { discountRules } from "@wix/ecom";
import { auth } from "@wix/essentials";

export interface DiscountOffer {
  id: string;
  name: string;
  offer: string;
  targetType: string;
}

function applies(scopes: any[] | undefined, productId: string): boolean {
  if (!scopes || scopes.length === 0) return false;
  for (const s of scopes) {
    const scopeId = s?._id ?? s?.id;
    if (typeof scopeId === "string" && scopeId.startsWith("all_")) return true;
    const ids = s?.catalogItemFilter?.catalogItemIds;
    if (Array.isArray(ids) && ids.length === 0 && s?.catalogItemFilter?.catalogAppId) return true;
    if (Array.isArray(ids) && ids.includes(productId)) return true;
  }
  return false;
}

function ruleApplies(rule: any, productId: string): boolean {
  const values = rule?.discounts?.values ?? [];
  for (const v of values) {
    if (v?.targetType === "SPECIFIC_ITEMS") {
      if (applies(v?.specificItemsInfo?.scopes, productId)) return true;
    } else if (v?.targetType === "BUY_X_GET_Y") {
      if (applies(v?.buyXGetYInfo?.customerBuys?.scopes, productId)) return true;
      if (applies(v?.buyXGetYInfo?.customerGets?.scopes, productId)) return true;
    }
  }
  return false;
}

export async function fetchLiveOffers(): Promise<any[]> {
  try {
    const elevated = auth.elevate(discountRules.queryDiscountRules);
    const res: any = await elevated({ paging: { limit: 50 } } as any);
    const list = res?.discountRules ?? res?.items ?? [];
    return list.filter((r: any) => r?.active !== false && r?.status !== "EXPIRED");
  } catch (err) {
    console.error("[discounts] queryDiscountRules failed:", err);
    return [];
  }
}

export function offersForProduct(rules: any[], productId: string): DiscountOffer[] {
  return rules
    .filter((r) => ruleApplies(r, productId))
    .map((r) => ({
      id: r._id ?? r.id,
      name: r.name ?? "",
      offer: (r.offer ?? r.name ?? "").toString(),
      targetType: r?.discounts?.values?.[0]?.targetType ?? "",
    }));
}
