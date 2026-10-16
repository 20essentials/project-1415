import { analytics } from '@wix/site';
import { hasAnalyticsConsent } from './consent';

export type AnalyticsEventName =
  | "AddToCart"
  | "RemoveFromCart"
  | "InitiateCheckout"
  | "Purchase"
  | "ViewContent"
  | "ClickProduct"
  | "Lead"
  | "ArticleView"
  | "FormSubmit"
  | "AddProductImpression"
  | "CustomEvent"
  | (string & {});

type TrackEventData = Parameters<typeof analytics.trackEvent>[1];

function isDev(): boolean {
  const meta = import.meta as unknown as { env?: { DEV?: boolean } };
  return Boolean(meta.env?.DEV);
}

export function trackEvent(
  name: AnalyticsEventName,
  payload?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

  if (!hasAnalyticsConsent()) {
    if (isDev()) {
      console.debug("[analytics] skipped (no consent)", name, payload);
    }
    return;
  }

  try {
    analytics.trackEvent(name, payload as TrackEventData);
  } catch (error) {
    if (isDev()) {
      console.debug("[analytics] failed", name, payload, error);
    }
  }
}
