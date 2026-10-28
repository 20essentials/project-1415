---
description: Step 42 — Wix Events: Open Day gratuito + tour guiado pagado · Petals & Predators
---
# Step 42 — Wix Events: Open Day gratuito + tour guiado pagado

> **Siguiente:** `/step-43-donations-campaign`

## Objetivo

La marca tiene una página **`/events`** con uno o más eventos públicos, los visitantes
se registran desde el sitio (RSVP gratuito o ticket pagado via checkout hosted de Wix)
y registramos intención de visita como leads.

## Contexto

- **Marca:** Petals & Predators — e-commerce de plantas carnívoras + flores. La idea:
  un **Open Day** en el vivero para conocer fisicamente las carnívoras ("Ven a conocer
  nuestras plantas") y un **tour guiado pago** con cupos limitados.
- **Design system:** `DESIGN.md` + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix (seguirlas al pie de la letra):**
  - Seed backend → `SKILL_ROOT/references/inline-recipes/setup-events.md` (Events V3,
    host público `https://www.wixapis.com/events/v3/...`, create draft + ticket
    definitions + publish).
  - Frontend → `SKILL_ROOT/references/inline-recipes/how-to-code-events.md`
    (listEvents / getEventBySlug / tiers + las dos vías de registro: `createRsvp`
    para RSVP gratuito, reserve → redirect hosted checkout para tickets).
- **App id de Wix Events** (referencia del frontend): `140603ad-af8d-84a5-2c80-a0f60cb47351`.
- **Estado (inspeccionar antes de empezar):** `src/features/`, `.wix/seeded.json`,
  el patrón de checkout hosted del step 36 (`src/features/workshops/workshop-checkout.ts`),
  el gating de consent del step 21/35 (`src/shared/analytics.ts`) y la plantilla de
  islas con estados idle/submitting/success/error (newsletter-form / review-form).
- La app debe instalarse por REST (CLI bloqueado por Node 22): receta
  [Add apps with the REST API](https://dev.wix.com/docs/go-headless/project-management/add-apps-with-the-rest-api#add-apps-with-the-rest-api)
  → `POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install`
  (body de la receta de AGENTS.md; tomar el `appDefId` de la tabla
  [Apps Created by Wix](https://dev.wix.com/docs/api-reference/articles/work-with-wix-apis/platform/about-apps-created-by-wix),
  nunca adivinarlo). Tras instalar, los primeros calls pueden fallar por propagación
  → retry con backoff (1s, 2s, 4s). Registrar en `.wix/seeded.json`.

## Functionality

1. **Instalar Wix Events** vía REST apps-installer + verify con un call Events V3.
2. **Seed de eventos** (receta `setup-events.md`): 1 evento **RSVP** gratuito
   "Open Day: Meet the Predators" (sin payment, con descripción atractiva + imagen del
   media del sitio) y 1 evento **TICKETING** "Guided Tour of the Greenhouse" (1 tier,
   precio bajo, capacidad limitada). Ambos en fechas futuras en el rango de demo.
   IDs/slugs → `.wix/seeded.json`.
3. **Feature `src/features/events/`** (kebab-case, sin barrel, concretos):
   - `events.ts` — data-access sobre Events V3 (`@wix/events`, o REST template si el
     pack del SDK difiere del recipe), `auth.elevate` + `try/catch` → `[]`/`null`:
     `listEvents()`, `getEventBySlug(slug)`, `listTicketTiers(eventId)`.
   - `event-registration.tsx` — isla React (mismo patrón de `workshop-booking.tsx`):
     modo **RSVP** (nombre + email → `createRsvp`; success con `role="status"`,
     error con `role="alert"` + retry) y modo **ticketed** (eligir tier → POST
     `/api/events/register` → redirect al checkout hosted con callbacks
     `postFlowUrl` localizado a la página de evento).
4. **API `src/pages/api/events/register.ts`** — POST: valida eventId/email, resuelve la
   sesión hosted (patrón step 36: `redirects.createRedirectSession` con
   `preferences.additionalQueryParameters.lang` desde cookie `wixLanguage`), mapea
   errores → 400/409/502. RSVP gratuito puede ir directo desde la isla o por el
   mismo endpoint (decidir según lo que la receta exponga ambient).
5. **Nav + i18n** — link `nav.events` → `/events` en `site.nav` (móvil) y
   `site.navPrimary` (desktop, mantener ≤ 6 links sin wrapping — si añadir rompe el
   layout medido, sustituir un link de bajo valor y documentarlo). Claves `events.*`
   + `nav.events` en `en`/`es`/`it` (`src/translations.json` + seeds es/it).
6. **Analytics bajo consent** — `CustomEvent` "EventRegistration" (payload sin PII:
   eventId/slug) emitido solo con `hasAnalyticsConsent` (patrón step 35).
7. **Tests** — unit: `tests/features/events/events.test.ts` (DTO mapping, 404/empty)
   + isla (estados); E2E: `tests/e2e/events.spec.ts` — `/events` 200 con títulos
   seeded, `/events/<slug>` 200 + form visible, slug inventado 404, `/es/events`
   localizado, RSVP submission valida (assertear solo lo que el repo controla).

## Pages / Sections

- `src/pages/events.astro` — listado de eventos próximos (cards con fecha, imagen,
  badge FREE/TICKETED y CTA → detalle).
- `src/pages/events/[slug].astro` — detalle (hero, descripción, venue, registro con
  la isla; 404 + noindex si el slug no existe).

## Design

- Tokens: fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`,
  énfasis `accent`; radii 4/6/12; transiciones 0.2s; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado. Cards alineadas con las de services/blog.

## Wix wiring

- Queries en runtime con `auth.elevate`, evitando acoplar páginas al SDK directo;
  `.wix/seeded.json` solo slugs/IDs de apoyo (no importar en rutas `.astro`).
- Fechas/capacidades reales del evento: tomarlas del evento seeded, no hardcodear.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde · `npm run check` 0 errores · `npm test` verde · `npm run test:e2e` en verde
- [ ] `/events` 200 con los 2 eventos seeded; `/events/<slug>` 200 con form; 404 en slug inventado; es/it 200
- [ ] RSVP gratuito registra un RSVP real contra el sitio en `wix dev`; tour ticketed redirige al checkout hosted con `postFlowUrl` localizado
- [ ] Verificaciones + hallazgos (IDs/slugs seeded) en la sección `## Resultado` de este archivo (fila 42 del ROADMAP corta, ver AGENTS.md)

## Al terminar

1. Marca el paso 42 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-43-donations-campaign`.

## Resultado

**App Wix Events** instalada vía REST (`POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install`, appDefId `140603ad-af8d-84a5-2c80-a0f60cb47351`, instancia `66836821-6142-43b2-b372-d967b7af9cd9`; verificado con Events V3 query 200). **Eventos sembrados** (`.wix/seeded.json → events`): Open Day RSVP (id `d172c511-0a82-4f94-ae6a-598c3c6e2755`, slug `open-day-meet-the-predators`, 2026-11-28T10:00–16:00Z, gratis) + Guided Tour TICKETING (id `6c3fd94e-20d7-4cf9-9f4f-56e3afeba52b`, slug `guided-tour-of-the-greenhouse-1`, tier "General Admission" `1cb20af0-5c67-4910-96b5-37179a28cdac` EUR 8.00, limit 12, limitPerOrder 4, OPEN_TICKETS). **Workaround:** las ticket-definitions dan 403 sobre un evento en DRAFT → se creó el tour como live (`draft:false` en `/events/v3/events`) y el tier vía gateway alternativo `https://www.wixapis.com/events-ticket-definitions/v3/ticket-definitions` (la creación del tier reabrió la registración a OPEN_TICKETS); el draft huérfano del primer intento queda invisible (identity sin `WIX_EVENTS.READ_DRAFT_EVENTS`). **Data-access `src/features/events/events.ts`:** `wixEventsV2.queryEvents` (filter `status $in [UPCOMING, STARTED]`, sort por `dateAndTimeSettings.startDate` ASC, `fields: [...EVENT_FIELDS]` `DETAILS/TEXTS/REGISTRATION/URLS`) · `getEventBySlug` · `getEventById` · tiers vía `orders.queryAvailableTickets` (filter `{eventId}`, price `price.amount ?? price.value ?? pricing.fixedPrice.value`) · `rsvpV2.createRsvp` (body plano `{eventId,firstName,lastName,email,status:'YES'}`) · `ticketReservations.createTicketReservation({tickets:[{ticketDefinitionId,quantity}]})` → `_id`; SSR lee con `auth.elevate` + try/catch→`[]`/`null`. **Decisión de alcance:** la recipe de `how-to-code-events.md` prohíbe `auth.elevate()` de visitor en registro → se sacrificó el `src/pages/api/events/register.ts` previsto: RSVP y checkout de tickets corren 100% client-side en la isla. **Isla `event-registration.tsx`** (`client:load`): dos modos (rsvp validación de nombre/email + tickets tier select + stepper con `limitPerCheckout`), estados idle/submitting/success/error, `role="status"`/`role="alert"` + retry; tickets → reserva → `redirects.createRedirectSession({eventsCheckout:{reservationId,eventSlug}, callbacks:{postFlowUrl back a la página, thankYouPageUrl /thank-you}, preferences.additionalQueryParameters.lang})` → `location.assign(fullUrl)`; errores de payment-gate detectados con mensaje propio (venta desactivada sin método de pago — plan free, documentado). Consent-gated `trackEvent("EventRegistration",{eventId,slug,mode})`. **Páginas:** `/events` (grid, badges Free/Ticketed, precio "from", formato Intl por locale) y `/events/[slug]` (hero + date/venue + isla; slug inexistente 404 con `noindex` + ruta de recuperación). Nav (mobile `nav` + desktop `navPrimary`): + "Events" (7 links, sin wrap verificado en e2e). i18n: 39 claves `nav.events`+`events.*` → **542 por idioma, paridad en/es/it EXACTA**. **Verificado:** `npm run check` 0 errores (148 files) · `npm test` 199/199 (`tests/features/events/events.test.ts` DTO/404/empty/tier-mapping + `event-registration.test.tsx` estados de isla: validación inline, success, alert de rechazo, tiers habilitado/deshabilitado, redirect al checkout con postFlowUrl localizado, mensaje payment-gate, retry) · `astro build` verde · `npm run test:e2e` 36/36 (5 nuevos: listing con badges, página RSVP con form, página ticketed, slug caverna → 404 + link, `/es/events` + detalle con `lang="es"`) · **No verificado:** compra real de ticket (requiere premium + método de pago en Wix) ni RSVP real (postearía en el sitio dev; cubierto por mocks unitarios)
