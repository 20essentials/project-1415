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

- [ ] `npx @wix/cli@latest build` en verde · `npm run check` 0 errores · `npm test` verde · `npm run test:e2e` en verde
- [ ] `/donate` 200 con campaña/montos o fallback informativo si la API no entrega la campaña; redirect al checkout real verificado en `wix dev`
- [ ] Fila 43 del ROADMAP con hallazgos del API + tradeoffs documentados

## Al terminar

1. Marca el paso 43 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-44-restaurant-jungle-tasting`.
