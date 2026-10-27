---
description: Step 43 — Wix Donations: campaña "nuevo local" · Petals & Predators
---
# Step 43 — Wix Donations: campaña "nuevo local" (`/donate`)

> **Siguiente:** `/step-44-restaurant-jungle-tasting`

## Objetivo

La marca recauda fondos para su **nuevo local** desde el sitio: página `/donate` con
montos sugeridos, barra de progreso hacia la meta y checkout hosted de Wix Donations
(one-time).

## Contexto

- **Marca:** Petals & Predators — abrir su primer showroom local. Tono: campaña viva y
  honesta ("Help us grow a second greenhouse").
- **Design system:** `DESIGN.md` + `.wix/design-tokens.css` + `src/styles/global.css`.
- **⚠️ Sin receta en el skill** para Donations: resolverlo primero con docs
  (`SearchWixRESTDocumentation` / dev.wix.com), Describe y confirmar el shape real del
  API antes de escribir código de acceso. No adivinar endpoints.
- **Estado**: patrón de teaser del home (lookbook/gift-cards/blog), consent del
  step 21/35, `.wix/seeded.json`.

## Functionality

0. **Research obligatoria antes de instalar/codificar:** buscar la app **Wix Donations**
   en [Apps Created by Wix](https://dev.wix.com/docs/api-reference/articles/work-with-wix-apis/platform/about-apps-created-by-wix)
   (o Market Listings Search `POST /devcenter/app-market-listing/v1/market-listings/search`
   con `searchTerm: "Wix Donations"` — el `appId` devuelto ES el `appDefId`) y leer la
   API: cómo se lee la campaña/goal, cómo se resuelve el checkout hosted, qué fields
   existen. Documentar hallazgos en el step file antes de seguir.
1. **Instalar Wix Donations** vía REST apps-installer (receta AGENTS.md) + retry backoff
   (1s,2s,4s) + verificación de propagación con un call de lectura.
2. **Config mínima viable** (según lo que exponga la API): campaña "New local",
   meta objetivo y montos sugeridos — si la API no permite crear/editar campañas
   (app API débil), dejar la config al dashboard y **documentar el tradeoff**, el
   código solo usará lectura + checkout.
3. **Feature `src/features/donations/`**:
   - `donations.ts` — data-access (lectura de campaña, goal/progress, montos) con
     `auth.elevate` + try/catch tolerante que no tumbe `/donate` (fallback a
     página informativa si falla todo, como gift-cards step 17).
   - `donate-form.tsx` — isla React: montos sugeridos + monto libre, validación
     client-side, estado idle/submitting/success/error, redirect al checkout hosted
     (si la vía es sesión hosted) o redirect al checkout default de la app.
4. **API `src/pages/api/donations/checkout.ts`** — POST: valida monto, resuelve la
   sesión/checkout con `lang` desde cookie `wixLanguage`, devuelve `{ checkoutUrl }`,
   mapea errores 400/502 (patrón club/workshop del step 36/37).
5. **Thank-you page** — `src/pages/donations/thank-you.astro` (o equivalente, según
   callbacks soportados), trivial, sin PII, `noindex`.
6. **Teaser en home** — opcional bajo el marcador `<!-- home:donations -->` (nuevo) o
   colgándolo del existente; mismo patrón de gift-cards/lookbook. CTA a `/donate`.
7. **Nav + i18n** — link `nav.donate` en `site.nav` (móvil); mantener ≤ 6 links en
   `site.navPrimary` (decidir si entra o solo móvil + teasers). Claves `donations.*`
   + `nav.donate` en en/es/it (`src/translations.json` + seeds es/it).
8. **Analytics bajo consent** — `Lead`/`CustomEvent` "DonationIntent" con payload sin
   PII (monto redondeado, no datos de contacto) solo con `hasAnalyticsConsent`.
9. **Tests** — unit `tests/features/donations/donations.test.ts` (DTO/fallbacks) + isla
   (estados/validación); E2E `tests/e2e/donations.spec.ts` — `/donate` 200 con montos
   y CTA, thank-you/noindex, `/es/donate` localizado. Assertear solo lo del repo.

## Pages / Sections

- `src/pages/donate.astro` — hero + campaña + montos + isla de donación + fineprint
  (el sitio e-commerce no procesa el cobro en línea: checkout hosted, no cart).
- `src/pages/donations/thank-you.astro` — agradecimiento post-donación.

## Design

- Tokens del sistema; barra de progreso con `var(--color-accent)` y altura discreta;
  responsive 375/768/1024/1280; `prefers-reduced-motion` respetado (sin animación de
  progreso al hacer scroll, solo estado estático).

## Wix wiring

- Lecturas con `auth.elevate` en runtime; **nunca importar** `.wix/seeded.json` en
  rutas `.astro`; slugs de campaña/IDs solo para apoyar el desarrollo.

## Verificación

- [x] `npx @wix/cli@latest build` en verde · `npm run check` 0 errores · `npm test` verde · `npm run test:e2e` en verde
- [x] `/donate` 200 con campaña/montos o fallback informativo si la API no entrega la campaña; redirect al checkout real verificado en `wix dev`
- [x] Fila 43 del ROADMAP con hallazgos del API + tradeoffs documentados

## Al terminar

1. Marca el paso 43 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-44-restaurant-jungle-tasting`.

## Hallazgos del research (verificados con docs dev.wix.com + skill how-to-code-donations)

- **App:** Wix Donations `appDefId` `333b456e-dd48-4d6b-b32b-9fd48d74e163`
  ([skill create-and-update-donation-campaigns](https://dev.wix.com/docs/api-reference/business-solutions/donations/skills/create-and-update-donation-campaigns)).
  En headless hace falta también su dependencia **eCommerce checkout** `1380b703-ce81-ff05-f115-39571d94dfcd`
  para aceptar pagos. La app SÍ se instala y las campañas SÍ se crean/editan por REST
  (`donation-campaigns/v2/donation-campaigns`) → no hay tradeoff de "API débil".
- **SDK `@wix/donations`**, namespace `donationCampaigns`: `queryDonationCampaigns`,
  `getDonationCampaign`, `getDonationCampaignMetrics`. Todos requieren
  `SCOPE.DONATIONS.MANAGE-CAMPAIGNS` → **siempre con `auth.elevate`**, incluso del lado
  visitante. La campaña vive en formato REST (`donationCampaigns`, `id`) y SDK (`items`, `_id`).
- **Lectura como donante:** query con `filter { archived: false }` + sort `createdDate DESC`;
  status `COLLECTING` = aceptando donaciones (un goal alcanzado NO cierra la campaña si
  `acceptDonationsAfterGoal`). Métricas de progreso (`donationCount`, `totalAmount` en
  `currencyMetricsList`) solo existen si `campaignGoal` fue configurado (400 `CAMPAIGN_GOAL_NOT_SET`
  si no). Moneda = la default del sitio (EUR).
- **Checkout hosted (one-time):** receta headless
  ([how-to-code-donations](https://github.com/wix/skills/blob/main/skills/wix-headless/references/inline-recipes/how-to-code-donations.md)):
  1. `POST /ecom/v2/carts` con `{ "cart": { "source": { "channelType": "WEB" } },
     "catalogItems": [{ "quantity": 1, "catalogReference": { "appId": "333b456e-…",
     "catalogItemId": "<CAMPAIGN_ID>", "options": { "amount": 25 } } }] }` — SDK
     `cartV2.createCart` (`@wix/ecom` Cart V2 flows). **El `options.amount` es número JSON,
     los precios de la campaña son strings decimales** → convertir/validar. Para one-time
     **se OMITE `frequency`** (solo `WEEK|MONTH|YEAR` van en el cart). `donorCoveringFees`
     solo si el donante optó (el flag suma el 2.9%; nunca inflar el monto a mano).
  2. El `cart.id` devuelto ES el `checkoutId`: `redirects.createRedirectSession({
     ecomCheckout: { checkoutId: <CART_ID> }, callbacks: { postFlowUrl, thankYouPageUrl } })`.
     **NO hay create-checkout V1** en este flujo y el carrito de donación es un Cart V2
     separado del carrito de compras actual.
  3. Navegar el documento completo a `redirectSession.fullUrl` (no SPA router/iframe).
- **Campaign object:** sin slug ni story; los presets (`predefinedDonationAmounts[].id`
  UUID + `price.amount` decimal string + `description` ≤200 chars) y
  `customAmountOptions.minimum/maximum` son las únicas fuentes de montos/copy de impacto.
  `name` 1–65 chars identifica la causa también en el checkout. `donationFrequencies`
  `['ONE_TIME']` para esta campaña (a pedido del step). Crear la campaña la activa en
  COLLECTING inmediatamente; PATCH exige `revision` incremental.
- **Decisión de config:** meta confirmada por el propietario — goal €20,000, presets
  €10/€25/€50/€100 con textos de impacto en inglés, monto libre habilitado con mínimo €5.
