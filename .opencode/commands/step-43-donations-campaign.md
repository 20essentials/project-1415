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
- [x] Hallazgos del API + tradeoffs en la sección `## Resultado` de este archivo (fila 43 del ROADMAP corta, ver AGENTS.md)

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

## Resultado

**App Wix Donations** instalada vía REST (`POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install`, appDefId `333b456e-dd48-4d6b-b32b-9fd48d74e163`, instancia `c1d91947-64eb-4646-b38c-4c82b24c0557`; era solicitada por la API de checkout de eCommerce `1380b703-ce81-ff05-f115-39571d94dfcd`, ya presente). **Campaña** `22aba8a5-0398-4231-8701-dcf16f0cecb5` reconfigurada in-place vía PATCH (revision 1→2, sobre el placeholder creado durante la instalación): name "New local", goal €20.000 EUR, presets 10/25/50/100 con textos de impacto, custom habilitado con mínimo €5, **ONE_TIME only**, comentarios off. Dependencia `@wix/donations@1.0.64` (`donationCampaigns.queryDonationCampaigns` builder eq/descending/limit/find) + `@wix/auto_sdk_ecom_cart-v-2` (`createCart` plano. **Receta hosted:** `catalogReference{appId, catalogItemId=<CAMPAIGN_ID>, options{amount:<number>}}` — omitir `frequency` ⇒ one-time; NO se llama a `checkout.id`: el `cart._id` devuelto es el checkoutId) + `@wix/redirects` (`ecomCheckout:{checkoutId}, callbacks{postFlowUrl:/donate, thankYouPageUrl:/donations/thank-you}, preferences.additionalQueryParameters.lang` con fallback fullUrl→urlDetails.endpoint→shortUrl). **Feature** `src/features/donations/` (`donations.ts` DTO memoizado + `getDonationGoal` desde `getDonationCampaignMetrics` — `currencyMetricsList` vacía ante cero donaciones ⇒ `progress bar` 200 solo cuando hay métricas reales (no se inventan totales); `checkout.ts` con `DonationCheckoutError` INVALID_INPUT/CHECKOUT_UNAVAILABLE y `parseDonationAmount` coma/punto compartida client+server; isla `donate-form.tsx` client:load POSTea `/api/donations/checkout`, `window.location.assign(checkoutUrl)`, `role="alert"`; fallback SSR (cards + CTA a contacto) si el query falla). **Páginas:** `/donate` (hero con nombre de campaña, breadcrumb, island) + `/donations/thank-you` (`noindex`, copy neutral sin afirmar pago). Nav: + "Donate" en `site.nav`; `navPrimary` sin tocar (7 links sin wrap). i18n 35 claves `donations.*`/`nav.donate`/`home.donations.*` → 577 por idioma paridad EXACTA en/es/it. Analytics consent-gated `Lead` en la isla. **Verificado:** `npm run check` 0 errores · `npm test` 219 passed (27 nuevos: DTO mapping/presets filtrado/dedup, goals, parse de montos, checkout payload+freq+fallbacks+errores, isla validación/redirect/nota de mínimo) · `npm run test:e2e` 36/36 (3 nuevos; cautela: un server dev stale en :4321 daba 404 por no tener las rutas nuevas — matarlo y `reuseExistingServer` re-levanta) · `@wix/cli build` verde. **No verificado:** pago real en el checkout hosted (requiere tarjeta) y retorno real desde el hosted flow · **Docs:** [Wix Donations API](https://dev.wix.com/docs/api-reference/business-solutions/donations) · [CreateCartOptions(redirectRecipe step-43)] · [Redirect session step-37](https://dev.wix.com/docs/api-reference/business-management/headless/redirects/create-redirect-session)
