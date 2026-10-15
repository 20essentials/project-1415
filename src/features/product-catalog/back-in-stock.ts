// SSR probe for the Wix back-in-stock service. The service identifies Stores by
// the sub-page registration id (1380b703-…), NOT the catalog appId (215238eb-…).

import { auth, httpClient } from "@wix/essentials";

export const WIX_STORES_BACK_IN_STOCK_APP_ID =
  "1380b703-ce81-ff05-f115-39571d94dfcd";
export const WIX_STORES_INSTALL_APP_ID =
  "215238eb-22a5-4c36-9e7b-e7c08025e04e";

export const SETTINGS_URL =
  "https://www.wixapis.com/back-in-stock-service/v1/back-in-stock-notification-requests/settings";

interface BackInStockCollectionState {
  appId?: string;
  collectingRequests?: boolean;
}

let cached: Promise<boolean> | null = null;

export async function getBackInStockEnabled(): Promise<boolean> {
  if (cached) return cached;
  cached = (async () => {
    try {
      const elevated = auth.elevate(httpClient.fetchWithAuth);
      const res = await elevated(SETTINGS_URL, { method: "PUT" });
      if (!res.ok) return false;
      const data = await res.json();
      const states: BackInStockCollectionState[] =
        data?.settings?.collectionStates ?? [];
      return states.some(
        (s) =>
          s.appId === WIX_STORES_BACK_IN_STOCK_APP_ID &&
          s.collectingRequests === true,
      );
    } catch (err) {
      console.error("[back-in-stock] getSettings probe failed:", err);
      return false;
    }
  })();
  return cached;
}
