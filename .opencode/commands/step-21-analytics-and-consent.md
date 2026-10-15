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
