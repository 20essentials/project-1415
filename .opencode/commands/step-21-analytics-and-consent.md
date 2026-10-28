---
description: Step 21 — Analytics + consent · Petals & Predators
---
# Step 21 — Analytics + consent

> **Siguiente:** `/step-22-performance-audit` (si aún no existe → `/generate-next-steps`)

## Objetivo

Añadir Wix Analytics (track de eventos clave) y, si aplica, un banner de consentimiento respetando privacidad. Mantener build verde (`npx @wix/cli@latest build`).

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Guía:** [Track analytics events (Wix Managed Headless)](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/track-analytics-events#track-analytics-events)
- **Estado:** Home, Shop, PDP, Cart, Checkout (hosted), Gift Cards, Reviews, Newsletter, Lookbook, Journal.

## Functionality

1. **Wix Analytics base**
   - Verificar si ya está habilitado (app/SDK). Usar `@wix/analytics` o patrón del integration según docs.
   - Eventos sugeridos (no invasivos, sin PII): `view_home`, `view_product`, `view_category`, `add_to_cart` (ya existe `trackEvent('AddToCart')` en `gift-card-purchase.tsx`), `begin_checkout`, `view_cart`, `subscribe_newsletter` (éxito), `submit_contact` (éxito). Evitar email/nombre en event payload.

2. **Consent banner (GDPR/CPRA razonable)**
   - Añadir componente `src/components/consent-banner.astro` o isla ligera (`client:idle`) con: texto, botones "Accept" / "Reject" (o "Decline"), link a política (si existe). Guardar preferencia en `localStorage` (`pp_consent_v1`).
   - Mostrar solo si no hay preferencia guardada. Respetar `prefers-reduced-motion`.
   - No bloquear render crítico. Si no hay política definida, enlazar a `/` o omitir link.

3. **Integración layout**
   - Montar banner en `src/layouts/BaseLayout.astro` antes del cierre `</body>` (o al final) para no afectar CLS.

4. **Traducciones**
   - Añadir claves `consent.title`, `consent.accept`, `consent.reject`, `consent.text` (opcional link) en `en`/`es`/`it`.

## Pages / Sections

- `src/components/consent-banner.astro` — Banner de consentimiento ligero.

## Design

- Tokens `paper`, `ink`, `paper-warm`, `rule`, `accent`. Radii 4/6/12px. Transiciones 0.2s. Responsive. `prefers-reduced-motion`.

## Wix wiring

- Usar eventos de Wix Analytics (SDK oficial) si disponible. No inyectar scripts de terceros.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Banner no aparece si ya hay preferencia (persistente)
- [ ] Banner responsive, accesible (focus, ARIA)
- [ ] Eventos trackeados sin romper páginas (no errores consola)
- [ ] i18n OK en `/es`, `/it`

## Al terminar

1. Marca paso 21 `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-22-performance-audit` (o `/generate-next-steps`).

## Resultado

**Docs:** [Track analytics events](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/track-analytics-events#track-analytics-events) · [Manage cookie consent](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/development/manage-cookie-consent) · **Límite:** `trackEvent()` solo entrega eventos en el sitio publicado con dominio propio → step 32 · `@wix/site@1.68.0` (exact) añadido a deps. `src/shared/consent.ts` (`CONSENT_STORAGE_KEY='pp_consent_v1'`, `ConsentState`, `ConsentPolicy` local — evita dep de `@wix/consent-policy-manager` —, `getConsentState`/`consentPolicyFor` (opt-in: `accepted` concede las 5 categorías, resto solo `essential`)/`hasAnalyticsConsent`/`applyConsentPolicy` (try/catch: el runtime no lanza fuera de Wix)/`setConsentState` (persiste + aplica)). `src/shared/analytics.ts` reescrito: `analytics.trackEvent` de `@wix/site`, `TrackEventData = Parameters<typeof analytics.trackEvent>[1]`, **gating propio** (`trackEvent` NO respeta consentimiento por sí solo) + try/catch; `AnalyticsEventName` amplía con `Lead`/`CustomEvent`. `src/shared/analytics-view.astro`: marcador `<script type="application/json" data-pp-analytics-view is:inline set:html>` + script bundled que lo lee y emite (verificado en SSR renderizado). Feature `consent`: `consent-bootstrap.astro` (inline, previo al runtime; lee localStorage y llama `setConsentPolicy`, con polling ≤3s al `window.consentPolicyManager`) + `consent-banner.astro` (SSR `hidden`, `<aside role="region" aria-labelledby>`, botones nativos, tokens del tema oscuro, `prefers-reduced-motion`; se muestra solo sin decisión previa) + `index.ts`; montados en `src/app/layout.astro`. Eventos: home `CustomEvent ViewHome`, categoría `ViewCategory` (`eventLabel`), PDP `ViewContent`, cart `ViewCart`, add-to-cart `AddToCart` (product-purchase + gift-card-purchase, sin cambios), cart remove `RemoveFromCart`, cart qty `CartUpdated`, checkout `InitiateCheckout` (reemplaza `cart_checkout_started`), newsletter/contact submit `Lead`. Sin PII. 4 claves `consent.*` en `en`/`es`/`it`. **Verificado:** `npm test` 44/44 (12 nuevos: `tests/shared/consent.test.ts` + `analytics.test.ts`, mock `tests/mocks/wix-site.ts`, alias `@wix/site` en `vitest.config.ts`); `wix build` verde (chunks `analytics.*`, `consent.*`, `consent-banner.*`, `analytics-view.*`); `astro dev` SSR de `/`→200 con marcador `{"event":"CustomEvent","payload":{"eventCategory":"Page","eventAction":"ViewHome"}}`, banner traducido y bootstrap `pp_consent_v1` presentes; **typecheck** `npm run check` (`astro check`, devDep `@astrojs/check` + script `check`) → 23 errores, **0 introducidos por este paso** (baseline stasheando los cambios de `src` = 23, mismos errores solo con líneas corridas; los 23 son preexistentes en `scroll-world.astro` (3), `site-search.astro` (1), `workshops/bookings.ts` (2), `workshop-booking.tsx` (2), `account.astro` (1), `index.astro` (1), `lookbook.astro` (1), `products/[slug].astro` (11), `products/index.astro` (1)). Bug propio detectado y corregido: los tests importaban los helpers del mock vía el alias `@wix/site` (válido solo en Vitest) → movido a import relativo `../mocks/wix-site`

> **Follow-up (post step-21):** resueltos los 23 errores de typecheck preexistentes. `npm run check` (`astro check`) → **0 errores** (92 files). Cambios: tipos concretos `V3Product` (`@wix/auto_sdk_stores_products-v-3`) y `Member` (`@wix/auto_sdk_members_members`) en vez de `ReturnType<typeof sdk…>` (resolvía el tipo del factory, no la promise); `fields: [...PRODUCT_FIELDS]` (readonly tuple → mutable); `product.currency` (V3) en vez de `minValue.currency` (no existe en `FixedMonetaryAmount`); `priceAmount: Number(amount)` (V3 `amount` es string); `formattedAmount ?? undefined`; `renderRicos(product.description as RicosDocument)`; guarda en `createWorkshopBooking` (booking ausente → `Error` → API 500); `Intl.DateTimeFormatPart.value` (**bug real**: las etiquetas de fecha del booking salían vacías); narrowing `'scroll' in stop`/`'linger' in stop` + `__swGoTo?.()`; `resolveWixImage*` y `ProductCard` aceptan `null` (campos V3 nullable). Verificado: `npm test` 44/44 y `npm run build` verde.
