---
description: Step 51 — Lista de espera en talleres (Bookings Waitlist API) · Petals & Predators
---
# Step 51 — Lista de espera en talleres (Bookings Waitlist API)

> **Siguiente:** `/generate-next-steps` (o el paso que el propietario pida)

## Objetivo

Cuando una sesión de taller está llena, los talleres muestran **"Join waiting list"**;
la lista (API de Wix) notifica cuando se libera un spot y lo reserva durante un
time-window para el primero de la fila. El owner administra desde el dashboard de
Bookings sin código nuevo.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
  Los talleres ya funcionan (steps 20 + 36: 4 servicios, checkout online). La
  waitlist evita perder la demanda de sesiones agotadas.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless`.
- **API confirmada en research ([About the Waitlist API](https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/waitlist/api-overview)):
  - `POST https://www.wixapis.com/bookings/v1/waitlist/register` — body:
    `waitingResource` (**token cifrado de la session**, el mismo string largo que el
    availability calendar entrega como `slot.sessionId`-equivalente), `formInfo`
    con `contactDetails` (firstName/lastName/email/phone) + `paymentSelection`
    (rateLabel → numberOfParticipants). Falla si la session no tiene waitlist o está llena.
  - `GET https://www.wixapis.com/bookings/v1/waitlist/list?waitingResources=<token>`
    → `registrations[]` con `status` WAITING/SUGGESTING/DECLINED/ENROLLED,
    `availableActions` (enroll/leave), `timeWindowMinutes`, `capacity`.
  - `POST https://www.wixapis.com/bookings/v1/waitlist/enroll` — book-from-waitlist
    (owner-side; con coupon/plan opcionales). Confirmar "leave" con docs.
  - **Restricción de la API (gotcha clave):** la waitlist solo cubre sessions con
    `type = EVENT`. **Verificar primero** que las sessions generadas por nuestros
    servicios de taller son de ese tipo (query availability + shape del slot); si no
    lo son, decidir: cambiar tipo del servicio seeded o fallar esta vía y construir
    waitlist propia sobre CMS (patrón restock alerts) — documentar la decisión.
  - Flujo de Wix: FIFO por orden de registro; al llegar una cancelación sugiere el
    spot en orden, lo reserva `timeWindowMinutes`, y si nadie acepta pasa a open-to-all.
- **Estado (inspeccionar antes de empezar):** `src/features/workshops/`
  (especialmente la isla de booking y su fetching de slots), pattern de form con
  estados idle/submitting/success/error (newsletter-form), `.wix/seeded.json → bookings`.

## Functionality

1. **Verificación previa:** confirmar tipo de session y la shape de `waitingResource`
   con availability calendar; confirmar permisos/scope reales del `register` para
   **visitor** (si exige owner, probar member token; si ninguna vía funciona, activar
   el fallback CMS y saltar a 5).
2. **Feature `src/features/workshops/waitlist.ts`** — data-access:
   `registerToWaitlist(sessionToken, contact)`, `listWaitlist(sessionToken)`,
   `leaveWaitlist(registrationId)` (si existe el endpoint); `auth.elevate` cuando
   aplique y try/catch → errores tipados (WAITLIST_FULL, NO_WAITLIST, SESSION_NOT_EVENT).
3. **Isla `waitlist-join.tsx`** — aparece en el detalle del taller cuando la sesión
   elegida está **sin disponibilidad** (la isla de booking ya sabe leer slots):
   form corto (nombre + email) → success: "You're on the list — we'll email you the
   first time a spot frees up" (`role="status"`); error: mensajes por tipo con
   `role="alert"` y retry.
4. **Posicionamiento:** integrar en la isla de booking actual (misma tarjeta de
   sesión: botón Full → swap a waitlist form) en vez de duplicar superficie.
5. **Fallback CMS (solo si la API no es usable por visitor):** collection
   `workshop-waitlist` (sessionId, sessionStart, firstName, lastName, email,
   createdAt, status) + nota honesta en UI de que no reserva spot (solo avisa),
   + el event-extension de cancelación (si existe hook Booking cancellation) para
   despachar aviso — documentar límites.

## Pages / Sections

- `src/pages/workshops/[slug].astro` (o como esté el detalle actual) — form de
  waitlist embebido en la tarjeta de sesión llena.

## Design

- Tokens: fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`,
  énfasis `accent`; radii 4/6/12; transiciones 0.2s; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.
- Badge "Full" + CTA de waitlist integrado en la misma tarjeta, no panel aparte.

## Wix wiring

- Queries en runtime; `.wix/seeded.json` solo session/service IDs de apoyo (nunca
  importarlo en rutas `.astro`).
- `contactDetails` del waitlist: mapear del form (no PII analytics).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde · `npm run check` 0 errores · `npm test` verde · `npm run test:e2e` en verde
- [ ] Con una sesión llena de prueba: `register` 200 con `registrationId`; `list` la muestra en WAITING; cancelar un booking libera el spot y la enrollment vía owner funciona
- [ ] Errores mapeados (session no EVENT, lista llena) → mensajes localizados sin romper la página
- [ ] Tests: unit `tests/features/workshops/waitlist.test.ts` (mapeo DTO + estados); E2E `tests/e2e/workshops-waitlist.spec.ts` (flujo form success/errores con datos de prueba)

## Al terminar

1. Doc hallazgos/tradeoffs/docs links en `## Resultado` (el go/no-go de la API vs
   fallback CMS es el hallazgo central de este paso).
2. Marca paso 51 `✅ done` en `ROADMAP.md` con celda Notas = `step-51-workshops-waitlist.md`.
3. Siguiente: `/generate-next-steps`.

## Resultado

### Go/no-go de la Bookings Waitlist API: NO-GO (hallazgo central)

La API nativa de waitlist (`POST /bookings/v1/waitlist/register`,
`GET /bookings/v1/waitlist/list?waitingResources=<token>`,
`POST /bookings/v1/waitlist/leave`) quedó descartada por verificación directa:

- Los nuestros son servicios **APPOINTMENT**. La disponibilidad
  (`POST https://www.wixapis.com/_api/service-availability/v2/time-slots`) no
  devuelve `session` para estos slots (sí lo hace para EVENT/class): sin
  encrypted session token no hay `waitingResource` con el que llamar a register.
- La semántica nativa solo existe para sesiones EVENT: el register pide el
  token de la sesión concreta.
- **Doble gotcha: una sesión agotada ni siquiera aparece en la disponibilidad.**
  Se creó un booking probe CONFIRMADO (Repotting Bench 2026-11-26T10:00) y el
  slot desapareció del listado de availability (no existe un slot con
  `remainingCapacity: 0` para APPOINTMENT; cada booking de 90 min absorbe tres
  inicios de 30 min). Por tanto no hay "sesión llena" renderizable por slot.
  El chip "Full" + branch `full` del island quedan igualmente (correctos y
  future-proof si algún día hay servicios COURSE/EVENT con capacidad grupal).
- Cancelación con `POST https://www.wixapis.com/bookings/v2/bookings/{id}/cancel`
  body `{bookingId, revision, participantNotification:{notifyParticipants:false}}`
  (obtener `revision` via `POST /_api/bookings-reader/v2/extended-bookings/query`,
  filter `{id: {$eq}}`) → `CANCELED` y el slot 2026-11-26T10:00 vuelve a ser
  `bookable: true`. El probe fue cancelado: el calendario quedó limpio.

### Fallback implementado (CMS, patrón restock-alerts)

- **Colección** `workshop-waitlist` (Data Collections extension
  `src/extensions/backend/data-collections/workshop-waitlist.ts`, registrada en
  `data-collections.extension.ts`): campos `workshopId, workshopName,
  sessionStart, firstName, email, status(waiting|notified), createdDate`,
  permisos ADMIN, índice `session-email` creado vía REST. La copia live se creó
  por REST (`POST /wix-data/v2/collections` con id `workshop-waitlist`) y probe
  insert/delete en verde; el repo pina el id sin namespace (re-chequear en
  release si la extensión registra una copia namespaced).
- **Data access** `src/features/workshops/waitlist.ts`:
  `joinWaitlist` (valida → dedupe `findWaitlistEntry` → insert `waiting`),
  `listWaitlistEntries` (FIFO por createdDate), códigos
  `INVALID_INPUT | ALREADY_LISTED | UNAVAILABLE`. `sessionStart` acepta
  datetime (`T10:00:00`) **o fecha sola** (`YYYY-MM-DD`): la venta de sesiones
  agotadas desaparece de availability, así que el join de un día completo se
  liga a la fecha, no a la hora imposible de reconstruir.
- **API** `src/pages/api/waitlist.ts` (POST): `200 ALREADY_LISTED`,
  `201 created`, `400 INVALID_INPUT`, `503 UNAVAILABLE`.
- **Island** `src/features/workshops/waitlist-join.tsx` (`WaitlistJoin`):
  badge/título/note/name/email/submit, estados `success|duplicate|error` con
  `role=status|alert` y `data-waitlist-state`. Se pinta en dos sitios:
  cuando un slot llega `full === true` (por slot) y cuando una **fecha futura
  queda sin horarios bookable** (estado de venta-out de un día APPOINTMENT).
  Hoy no se ofrece para la fecha de hoy (cutoff same-day no dispara waitlist).
- **Wiring** `[slug].astro` pasa `fullSlot` + `waitlist.*` desde `t()`;
  claves nuevas `services.slot-full` y `services.waitlist.*` en
  `src/translations.json` + es/it (`note` re-dactada por fecha, no "sesión").

### Gotchas aprendidos

- Sold-out = slot ausente (APPOINTMENT), no `remainingCapacity: 0`; el "Full"
  real solo existe para servicios con sesión EVENT/COURSE.
- Duplicado por carrera de workers: los E2E comparten la colección live, así
  que el E2E assertea estado terminal positivo (`success|duplicate`) y el
  mapeo fino insert-vs-duplicate lo cubren los unit tests. Chequeado con curl
  contra un server estable el dedupe funciona exacto (201 → 200 ALREADY_LISTED).
- `/api/slots` puede tardar 8–21 s en dev: los waits de 15 s de Playwright se
  subieron a 30 s.
- La colección live se limpia tras cada run (entradas probe borradas); al
  terminar el paso queda vacía.

### Verificación

- `npm test` 368/368 verde (54 files); incluye
  `tests/features/workshops/waitlist.test.ts` (19 tests talleres: dedupe,
  INVALID_INPUT, UNAVAILABLE, date-only key, listas FIFO) y
  `tests/features/workshops/waitlist-join.test.tsx` (jsdom).
- `npm run test:e2e` — spec nuevo `tests/e2e/workshops-waitlist.spec.ts`
  3/3 verde contra el server dev (2026-11-29 sin horarios, formulario válido,
  campos requeridos, hoy sin card).
- `npm run check` 0 errores / 0 warnings (237 files).
- `node_modules/.bin/wix build` exit 0.
- Screenshots en `./.tmp/step51-waitlist-mobile.png` (390×844) y
  `./.tmp/step51-waitlist-desktop.png` (1280×900); card sin overflow,
  bounding boxes medidas (mobile 37+316 < 390). **Abrirlos y revisar el
  card**: el agente no inspecciona la imagen, se midieron con
  `boundingBox()` programático.
- Restauración: probe booking cancelado y slot 2026-11-26T10:00 vuelve
  `bookable: true`; collection `workshop-waitlist` queda vacía.

### Docs usados

- Cancel Booking:
  https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-writer-v2/cancel-booking
- Extended bookings query (revision):
  https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-reader-v2/query-extended-bookings
- List Availability Time Slots (comportamiento sold-out medido):
  https://dev.wix.com/docs/api-reference/business-solutions/bookings/time-slots/time-slots-v2/list-availability-time-slots
