---
description: Step 36 — Workshops pagados: checkout online · Petals & Predators
---
# Step 36 — Workshops pagados: checkout online (Bookings)

> **Siguiente:** `/step-37-plant-parent-club-membresia-pricing-plans` (si aún no existe → `/generate-next-steps`)

## Objetivo

Los workshops dejan de reservarse solo con pago offline: el cliente elige un slot, completa el formulario y paga online en el checkout hosted de Wix (Bookings). Al volver, `/booking-confirmation` refleja el estado real del pago, y los abandonos vuelven al servicio con un aviso claro.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/workshops/bookings.ts`
  (`createWorkshopBooking` con `selectedPaymentOption: 'OFFLINE'`, `WorkshopBookingError`,
  `SITE_TIMEZONE`), `src/features/workshops/workshop-booking.tsx` (isla de reserva),
  `src/pages/api/bookings.ts`, `src/pages/api/slots.ts`, `src/pages/services.astro`,
  `src/pages/services/[slug].astro`, `src/pages/booking-confirmation.astro`,
  `src/features/cart/cart-view.tsx` (patrón `redirects.createRedirectSession` ya usado),
  `.wix/seeded.json` (bloque `bookings`).
- **Prerrequisitos de negocio:** pagos online activos en el dashboard (Wix Payments o
  proveedor conectado) y dominio del sitio como **allowed redirect domain**. Si no están,
  el código puede quedar completo pero la verificación end-to-end se marca como no verificada.
- **API (confirmar antes de codificar):** el shape exacto de `slotAvailability` en
  `redirects.createRedirectSession({ bookingsCheckout })` y el comportamiento de
  `bookings.createBooking({ selectedPaymentOption: 'ONLINE' })` (¿crea booking PENDING con
  `paymentStatus`?). Leer el schema con `SearchWixAPISpec` / la doc de Bookings; **no adivinar**.

## Functionality

1. **`src/features/workshops/bookings.ts` — soportar pago online**
   - Extender la firma de `createWorkshopBooking` con `paymentOption: 'OFFLINE' | 'ONLINE'`
     (default `'OFFLINE'` para no romper llamadas existentes) y pasarlo a
     `bookings.createBooking`.
   - Exponer `Workshop.paymentOption` (o `onlinePaymentEnabled`) derivado del servicio si la
     API lo informa; si no, decidir por config del paso y documentarlo.
   - Mantener la normalización de teléfono a E.164 y el mapeo de errores Wix existente.
2. **`src/features/workshops/workshop-checkout.ts` (nuevo)**
   - `createWorkshopCheckout({ serviceId, localStartDate, timezone, resource, language, returnToUrl })`:
     llama `redirects.createRedirectSession` con
     `bookingsCheckout: { slotAvailability: { serviceId, startDate, endDate, timezone, resource }, timezone }`,
     `callbacks: { postFlowUrl, thankYouPageUrl }` y
     `preferences: { additionalQueryParameters: { lang } }` (mismo patrón que `cart-view.tsx`).
   - Devolver `fullUrl` y lanzar un error propio (`WorkshopCheckoutError`) con códigos
     `INVALID_INPUT` / `CHECKOUT_UNAVAILABLE` cuando falte `fullUrl`.
   - Sin `auth.elevate` innecesario: la sesión de redirect se crea con la identidad del visitante.
3. **`src/pages/api/bookings.ts`**
   - Aceptar `payment: 'online' | 'offline'` en el body (validar contra enum; default offline).
   - Flujo online: crear el booking con `ONLINE` y devolver
     `{ booking, checkoutUrl }` (200). Flujo offline: responder como hoy.
   - Mapear `SLOT_NOT_AVAILABLE → 409`, `INVALID_ARGUMENT → 400`, checkout sin URL → 502
     `CHECKOUT_UNAVAILABLE`; `console.error` solo en el 500.
4. **`src/features/workshops/workshop-booking.tsx`**
   - Si hay checkoutUrl, `window.location.assign(checkoutUrl)` en vez de mostrar el recibo.
   - Mantener estados idle/submitting/error, `aria-busy`, `role="status"`/`alert`, retry en 409
     y el texto del botón según modo ("Book & pay" / "Reserve").
   - En error `CHECKOUT_UNAVAILABLE`, mostrar aviso y ofrecer el modo offline si el servicio lo
     permite (sin dejar el formulario en estado inconsistente).
5. **Abandono / cancelación**
   - `postFlowUrl` vuelve a `/services/[slug]?booking=cancelled` (localizado). El servicio
     muestra un banner `role="status"` "Your spot isn't reserved yet" con CTA a reintentar.
   - `thankYouPageUrl` va a `/booking-confirmation` con el `id` del booking; la página tolera
     llegar sin params (estado informativo, como hoy) y no expone PII.
6. **`src/pages/booking-confirmation.astro`**
   - Con `id` presente, resolver el booking (server-side) para mostrar estado y `paymentStatus`;
     si la lectura falla, caer al render actual basado en query params.
   - Reutilizar el `Schedule` de analytics del step 35 (no duplicar el evento); emitirlo solo
     cuando la reserva esté confirmada y con consentimiento.
7. **i18n** — nuevas claves `services.payment.*` y `booking-confirmation.payment.*` en
   `src/translations.json` + `.wix/multilingual/translations/{es,it}.json` (paridad exacta de
   conteo entre los 3 idiomas).
8. **Tests**
   - `tests/features/workshops/workshop-checkout.test.ts`: payload correcto a
     `redirects.createRedirectSession`, idioma propagado, `fullUrl` devuelto, ausencia de
     `fullUrl` → error.
   - Ampliar `tests/features/workshops/bookings.test.ts`: `paymentOption` se reenvía a
     `createBooking`; offline sigue igual.
   - E2E: reserva online con slot sembrado → redirección al checkout hosted (sin completar pago
     real) y retorno cancelado → banner en el servicio.

## Pages / Sections

- `src/pages/services/[slug].astro` — banner de cancelación + copy de pago online.
- `src/pages/booking-confirmation.astro` — estado de pago y confirmación.
- `src/pages/api/bookings.ts` — contrato nuevo `payment`/`checkoutUrl`.
- Sin ruta nueva.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`,
  superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.
- El banner de cancelación usa `border-rule` + `bg-paper-warm`; nada de rojo alarmante.

## Wix wiring

- `@wix/bookings` (`createBooking`) y `@wix/redirects` (`createRedirectSession`) ya en deps.
- Verificar el shape de `slotAvailability` contra el schema oficial antes de escribir el body.
- `.wix/seeded.json` solo para IDs de servicios/slots de apoyo (nunca importado en `.astro`).
- Requiere pagos online configurados y dominio permitido en el dashboard (paso manual).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde
- [ ] `POST /api/bookings` con `payment: 'online'` devuelve `checkoutUrl` válido (o 502 con
      motivo documentado si el sitio no tiene pagos online)
- [ ] Con `payment: 'offline'` el comportamiento previo no cambia (booking CONFIRMED, recibo)
- [ ] Slot ya tomado → 409 `SLOT_UNAVAILABLE` y la isla permite reintentar
- [ ] `/booking-confirmation?id=…` muestra estado de pago; sin params sigue siendo 200
- [ ] `?booking=cancelled` muestra el banner y no crea bookings
- [ ] Paridad de claves i18n en/es/it
- [ ] Reporte explícito de hasta dónde llegó la verificación (redirect creado vs. pago completado)

## Al terminar

1. Marca el paso 36 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-37-plant-parent-club-membresia-pricing-plans` (o `/generate-next-steps`).
