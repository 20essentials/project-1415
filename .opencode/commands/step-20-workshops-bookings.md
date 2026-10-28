---
description: Step 20 — Workshops (Bookings) · Petals & Predators
---
# Step 20 — Workshops (Bookings)

> **Siguiente:** `/step-21-analytics-and-consent` (si aún no existe → `/generate-next-steps`)

## Objetivo

Entregar un flujo de workshops (talleres) con Wix Bookings: instalar la app, crear los servicios "Care 101" y "Repotting 101", exponer `/services` (listado + detalle accesible) y añadir el link en navegación. Al terminar, el sitio sigue compilando (`npx @wix/cli@latest build` verde).

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Apps / SDK:** `@wix/bookings` (cuando aplique). Usar `auth.elevate` solo si hace falta acceder a datos vía backend/seed context. No inventar IDs.
- **Estado (inspeccionar antes de empezar):** `src/pages/`, `src/components/`, `.opencode/commands/`, `ROADMAP.md`, `.wix/seeded.json`, `src/layouts/nav.astro`, `src/translations.json`.

## Functionality

1. **Inspeccionar estado actual**
   - Revisar `.wix/seeded.json`: ¿existe `bookings`/servicios? ¿app instalada?
   - Revisar `src/layouts/nav.astro` y `src/components/nav-primary.astro` para ver cómo se añaden links.
   - Revisar `src/translations.json` (claves `nav.*`, `services.*` si existen).

2. **Instalar app Wix Bookings (si falta)**
   - Usar REST `POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install` con `tenantType: "SITE"`, `siteId` desde contexto y `appDefId` correcto para **Wix Bookings**. Buscar `appDefId` en *Apps Created by Wix* (ver sección Apps de Wix en `AGENTS.md`) si no está claro.
   - **Nunca adivinar.** Si no encuentras `appDefId` explícito, consultar receta en `wix-manage`/skill antes de llamar.
   - No chequear si ya está instalada (instalar directo y manejar error si ya existe). Registrar resultado en `.wix/seeded.json` bajo `bookings.installedAt`/`appInstanceId` si aplica.

3. **Crear servicios mínimos**
   - Crear (o asegurar) dos servicios en Wix Bookings: **"Care 101"** y **"Repotting 101"**. Campos mínimos: nombre, slug (kebab-case), descripción breve (EN), duración, precio si aplica, visibilidad pública.
   - Usar `@wix/bookings`/REST según lo que dictaminen skills. Si se usan seeds, escribir en `.wix/seeded.json` (`bookings.services[]` con `serviceId`, `slug`, `name`).
   - No hardcodear IDs ficticios. Leer respuesta real.

4. **Página `/services` (listado)**
   - Crear `src/pages/services.astro` que liste ambos servicios con: nombre, descripción corta, duración/precio (si presente), link a detalle `/services/[slug]`.
   - Mantener estilo coherente con `shop.astro`/`products/index.astro`: tokens, tipografías, espaciados, bordes `rule`, foco visible.
   - Soportar i18n: usar `t('services.title')`, `t('services.view')` u otras claves; añadir a `src/translations.json` (en/es/it) si faltan (mantener estructura plana, 270+ coherente con estado actual).

5. **Detalle `/services/[slug].astro`**
   - Crear ruta dinámica `src/pages/services/[slug].astro` con `getStaticPaths()` (o SSR según integración). Mostrar servicio completo: descripción, duración, precio, formulario/acción para reservar (usar componentes/flujo estándar de Bookings o link a hosted page si corresponde).
   - 404 si slug desconocido.
   - Accesible: headings, alt vacío si imagen, focus states.

6. **Navegación**
   - Añadir link "Workshops" / `nav.services` a `site.navPrimary` (desktop) y a `site.nav` (móvil) en `src/layouts/nav.astro` (o componente usado). Mantener 5–6 links en primary sin wrapping excesivo (seguir criterio step 17).
   - Añadir clave `nav.services` en `en`/`es`/`it` en `src/translations.json`.

7. **Integridad**
   - No romper rutas existentes. No duplicar lógica de fetching innecesaria.
   - Respetar `prefers-reduced-motion`.

## Pages / Sections

- `src/pages/services.astro` — Listado de talleres.
- `src/pages/services/[slug].astro` — Detalle de taller.

## Design

- Tokens: `paper`, `ink`, `paper-warm`, `rule`, `accent`.
- Radii 4/6/12px. Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`. Responsive 375/768/1024/1280. `prefers-reduced-motion` respetado.

## Wix wiring

- `@wix/bookings` para leer servicios (runtime). Si se crean vía seed/script, usar `auth.elevate` solo cuando necesario.
- `.wix/seeded.json` solo para slugs/IDs de apoyo (nunca importarlo en rutas `.astro`).
- No asumir checkout inline: si Bookings requiere hosted page, redirigir acorde a docs.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `/services` responde 200 (listado renderiza Care 101 y Repotting 101)
- [ ] `/services/care-101` y `/services/repotting-101` responden 200 con contenido mínimo
- [ ] Link "Workshops" visible en nav desktop+móvil
- [ ] i18n OK para `/es/services` y `/it/services`
- [ ] Accesible: focus visible, sin jerarquía rota

## Al terminar

1. Marca el paso 20 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-21-analytics-and-consent` (o `/generate-next-steps`).

## Resultado

`src/utils/bookings.ts` (`listWorkshops`, `getWorkshopBySlug`/`ById`, `listWorkshopSlots` — mapea `LocationType BUSINESS→OWNER_BUSINESS` de forma tipada —, `createWorkshopBooking`: `startDate` local `YYYY-MM-DDThh:mm:ss` + `timezone: Europe/Rome` (verificado en runtime: Wix lo guarda como `2026-10-16T10:00:00.000+02:00`), `selectedPaymentOption: 'OFFLINE'`, `notifyParticipants:true`, `normalizePhone` (espacios/`.`/`-` fuera, `00…`→`+…`, 6–15 dígitos sueltos→`+39…`) porque Wix exige E.164; `WorkshopBookingError`). API: `GET /api/slots` (rango `[hoy, hoy+60d]`, 404 servicio desconocido) y `POST /api/bookings` (mapea `applicationError` de Wix: `SLOT_NOT_AVAILABLE`→409 `SLOT_UNAVAILABLE`, `INVALID_ARGUMENT`→400 `INVALID_INPUT`). Páginas: `/services` (grid con `service-card.astro` + isla `workshop-booking.tsx`: rail de 14 días, slots, form progresivo, `aria-pressed`/`role=status`/`alert`, retry en 409, `confirmationBase` localizado), `/services/[slug]` (SEO lo emite Wix: title/description/og — sin metas propias duplicadas), `/booking-confirmation` (estados con/sin datos, solo query params — sin PII —, `noindex`). Nav: `nav.services` sustituye `/#collection` en `navPrimary` y entra en el menú móvil tras `/products`. 359 claves en `en`/`es`/`it` (incl. `services.retry`). **Verificado:** build verde; curl en `wix dev`: `/services` 200 (Care 101 + Repotting 101), `/services/care-101` y `/repotting-101` 200, `/services/nope` 404, `/es/services` y `/it/services/care-101` 200 con props localizadas (labels + `confirmationBase` `/it/booking-confirmation`); round-trip real de reserva (crear→CONFIRMED con teléfono local `3331234567` normalizado, `notifyParticipants` OK) y **canceladas las 2 reservas de prueba** (`bookings-service/v2/bookings/{id}/cancel` — requiere `revision`, que se lee del `booking` que envuelve cada item de `_api/bookings-reader/v2/extended-bookings/query`; quedan 6/6 CANCELED, sitio limpio); 409 `SLOT_UNAVAILABLE` verificado en fecha sin slots; unit 32/32; e2e 9/9 (se corrigió un locator ambiguo — sin scope — en `tests/e2e/gift-cards.spec.ts`: `form button[type="submit"]` también matcheaba el Subscribe del footer; era un fallo **preexistente**, confirmado contra HEAD, no de este paso). A11y revisada en el HTML renderizado (un solo `h1`, `focus-visible` en todo interactivo, `aria-*`), sin axe en el repo (no hay corrida automatizada)
