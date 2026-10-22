---
description: Step 35 — Analytics: eventos faltantes + plataformas externas + consentimiento granular · Petals & Predators
---
# Step 35 — Analytics: eventos faltantes + plataformas externas + consentimiento granular

> **Siguiente:** `/step-36-workshops-pagados-checkout-online-bookings` (o `/generate-next-steps`)

## Objetivo

Completar eventos de analytics faltantes (`Purchase`, `Schedule`, `AddProductImpression`, `ClickProduct`, `StartPayment`), documentar `CheckoutStep`/`AddPaymentInfo` como no instrumentables en checkout hosted de Wix, conectar plataformas externas (GA4/GTM/Meta) desde el dashboard de Wix y extender el consentimiento a granular por categoría con UI para reabrir/revocar desde el footer. Toda la entrega de eventos se verifica en producción con dominio propio (step futuro), pero el código y tests van en este paso.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/shared/analytics.ts`, `src/shared/consent.ts`,
  `src/features/consent/`, `src/app/layout.astro`, `src/pages/thank-you.astro`,
  `src/pages/booking-confirmation.astro`, `src/pages/cart.astro`, `src/pages/products/`,
  `src/features/cart/`, `src/features/product-catalog/`, `ROADMAP.md`.

## Functionality

1. **Purchase en thank-you**
   - Actualizar `src/pages/thank-you.astro` para leer `orderId` de query params (si viene) y, en server-side, obtener el pedido necesario sin exponer PII.
   - Emitir `Purchase` con `transaction_id`/`value`/`currency`/`contents` usando `trackEvent` solo con consentimiento de analytics.
   - Pasar `thankYouPageUrl` en el redirect de checkout cuando sea aplicable (documentar dónde se configura y asegurar que llega `orderId`).
   - Añadir gating por consentimiento y `try/catch` (igual que el resto de `trackEvent`).

2. **Schedule en booking-confirmation**
   - En `src/pages/booking-confirmation.astro`, emitir `Schedule` cuando hay datos de reserva válidos (solo query params, sin PII). Respetar consentimiento y reducir movimiento si aplica.

3. **Impresiones y clicks de producto**
   - En el grid de catálogo (`src/features/product-catalog/` y páginas `src/pages/products/index.astro`, `src/pages/category/[slug].astro`), emitir `AddProductImpression` con `items` limitados (no todo el listado) y `ClickProduct` al hacer click en tarjeta/producto.
   - Usar listeners delegados en isla pequeña o script inline ligero, siempre gateados por consentimiento.

4. **StartPayment antes del redirect**
   - En el flujo de carrito/checkout, emitir `StartPayment` justo antes de redirigir al checkout hosted de Wix. Documentar que `CheckoutStep`/`AddPaymentInfo` **no son instrumentables** con el checkout hosted (añadir comentario en código/docs).

5. **Plataformas externas desde dashboard**
   - Documentar en `docs/analytics.md` cómo conectar GA4/GTM/Meta desde el dashboard de Wix (Settings → Marketing Integrations / Tracking & Analytics) y cómo verificar forwarding.
   - No añadir scripts externos al repo; solo documentación y asegurarse de que `trackEvent()` sigue funcionando con el runtime de Wix.

6. **Consentimiento granular por categoría**
   - Extender `src/shared/consent.ts` para soportar preferencias granulares (`analytics`, `marketing/advertising`, `functional`, `preferences`) con estado persistido (`pp_consent_v1_granular` o migración compatible con `pp_consent_v1`).
   - Actualizar `applyConsentPolicy` para aplicar categorías granulares vía `consentPolicyManager` cuando esté disponible.
   - Añadir UI para reabrir/revocar preferencias desde el footer (`src/app/footer.astro` o feature `consent`) con modal/aside accesible.
   - Actualizar `hasAnalyticsConsent` para respetar categoría `analytics` granular y mantener compatibilidad hacia atrás con `accepted/rejected`.
   - Añadir tests de gating (unit) para el nuevo comportamiento.

## Pages / Sections

- `src/pages/thank-you.astro` — emitir `Purchase` con datos del pedido (sin PII)
- `src/pages/booking-confirmation.astro` — emitir `Schedule`
- `src/pages/cart.astro` / `src/features/cart/cart-view.tsx` — emitir `StartPayment` antes de redirect
- `src/pages/products/` y `src/pages/category/[slug].astro` — `AddProductImpression`/`ClickProduct`
- `src/app/footer.astro` — acceso a preferencias de cookies/consentimiento

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`,
  superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.
- Modal de preferencias accesible: `role="dialog"`, `aria-modal="true"`, focus trap ligero, cierre con Escape.

## Wix wiring

- Usar `@wix/site` `analytics.trackEvent` (ya en deps). Gating propio por consentimiento.
- `consentPolicyManager` vía `@wix/site` (usar try/catch fuera de contexto Wix).
- Checkout hosted de Wix → documentar limitaciones (`CheckoutStep`/`AddPaymentInfo` no instrumentables).
- Plataformas externas conectadas desde dashboard (sin añadir SDKs de terceros al repo).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `Purchase` emitido en `thank-you` solo con consentimiento (sin PII)
- [ ] `Schedule` emitido en `booking-confirmation`
- [ ] `AddProductImpression`/`ClickProduct` en grids
- [ ] `StartPayment` antes de redirect a checkout hosted
- [ ] Consentimiento granular persistido y revocable desde footer
- [ ] Documentación `docs/analytics.md` con integración GA4/GTM/Meta desde dashboard
- [ ] Tests unitarios de gating granulares añadidos/actualizados
- [ ] `npm run check` y `npm test` verdes

## Al terminar

1. Marca el paso 35 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-36-workshops-pagados-checkout-online-bookings` (o `/generate-next-steps`).
