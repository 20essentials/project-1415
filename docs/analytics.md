# Analytics

This project uses Wix Site Analytics (`@wix/site` `analytics.trackEvent`) with a custom consent gate.

## Events

- `Purchase` — emitted on `thank-you` page when `orderId`/`orderNumber`/`transactionId` is present in query params. Only with analytics consent. PII avoided.
- `Schedule` — emitted on `booking-confirmation` when booking details are present. Only with analytics consent.
- `AddProductImpression` — limited impressions (up to 12 items) on product grids (`/products`, `/category/[slug]`) with a small inline script; consent gated.
- `ClickProduct` — emitted on product card click in grids; consent gated.
- `InitiateCheckout` / `StartPayment` — emitted in cart before redirect to Wix hosted checkout. `CheckoutStep` and `AddPaymentInfo` are **not instrumentable** with Wix hosted checkout and are documented as unsupported.

## Consent

Granular consent is stored in `localStorage` (`pp_consent_v1` and `pp_consent_v1_granular`). Categories: `analytics`, `marketing/advertising`, `functional/preferences`. `hasAnalyticsConsent()` respects the `analytics` category. Preferences can be reopened/revoked from the footer ("Cookie preferences").

## External platforms (GA4/GTM/Meta) via Wix dashboard

Do **not** add third-party SDKs to this repo. Connect them from the Wix dashboard:

1. Open your Wix site in the dashboard → Settings → Marketing Integrations (or Tracking & Analytics depending on your Wix plan/editor).
2. Connect Google Analytics 4, Google Tag Manager, Meta Pixel, etc. as offered by Wix.
3. Ensure consent settings in Wix match your policy if available.
4. Publish the site with a custom/domain as appropriate (see roadmap note). `trackEvent()` will continue to forward via Wix runtime where configured.
5. Verify events in the connected platforms after publish.

## Notes

- Events are gated by consent and wrapped in `try/catch`.
- `thankYouPageUrl` / redirect callbacks should pass order identifiers when possible; this code reads them from query params.
