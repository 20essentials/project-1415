---
description: Step 44 — Wix Restaurants: cena selvática "Jungle Tasting" con reservas · Petals & Predators
---
# Step 44 — Wix Restaurants: cena selvática "Jungle Tasting" con reservas (`/dining`)

> **Siguiente:** `/generate-next-steps` (o el paso que el propietario pida)

## Objetivo

La marca usa las apps **Wix Restaurants Menus + Table Reservations** para un evento
gastronómico: superficie `/dining` que muestra el menú selvático y permite **reservar
la cena-experiencia** (Experiences) con decoración de plantas.

## Contexto

- **Marca:** Petals & Predators — pitch "prueba nuestra comida selvática rodeado de
  plantas". Concepto: **experiencia de degustación** reservable (chef's table) por
  turnos limitados en la misma tienda/vivero.
- **Design system:** `DESIGN.md` + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix (seguirlas al pie de la letra):**
  - Apps: instalar **Menus** (appDefId `b278a256-2757-4f19-9313-c05c783bec92`)
    + **Table Reservations** (`f9c07de2-5341-40c6-b096-8eb39de391fb`). **NO instalar
    Orders** (sin pickup/delivery en este modelo — la experiencia se reserva, no se
    pide comida para llevar).
  - Seed menú → `SKILL_ROOT/references/inline-recipes/setup-restaurants.md`
    (la instalación fresca trae una "Dinner Menu" default: quitarla **solo si es
    claramente el sample del install**, luego bulk-create items → sections → menu
    con el tema selvático).
  - Experiences → `SKILL_ROOT/references/inline-recipes/setup-restaurant-experiences.md`
    (Experiences es un feature del app Table Reservations, no un install extra:
    crear la "Jungle Tasting Dinner" con precio, ubicación y availability recurrente).
  - Frontend menú → `SKILL_ROOT/references/inline-recipes/how-to-code-restaurants.md`
    (display-only: listMenus/listSections/listItems + re-orden por id arrays +
    `priceInfo` — sin cart ni checkout).
  - Frontend reserva → `SKILL_ROOT/references/inline-recipes/how-to-code-restaurant-reservations.md`.
- **Estado (inspeccionar antes de empezar):** `src/features/`, `.wix/seeded.json`,
  patrón booking del step 20/36 (timezone `Europe/Rome`, rail de días/slots), consent
  del step 21/35, islas con estados idle/submitting/success/error.
- **Instalación por REST** (CLI bloqueado por Node 22): receta AGENTS.md
  `POST /apps-installer-service/v1/app-instance/install` con retry backoff (1s, 2s, 4s);
  verificar propagación con un call Menus V1; registrar en `.wix/seeded.json`.

## Functionality

1. **Instalar Menus + Table Reservations** por REST y verificar propagación.
2. **Seed del menú** con la receta: si la única cosa visible es la "Dinner Menu"
   sample → borrarla (children antes que parents: items → sections → menus) y crear
   **"Jungle Tasting"**: 3–4 secciones (p. ej. Botanical bar / Predator plates /
   Garden desserts / Drinks) con items, precios y fotos del media del sitio. Guardar
   IDs/slugs en `.wix/seeded.json`.
3. **Experiences + availability:** seguir `setup-restaurant-experiences.md` para
   declarar la "Jungle Tasting Dinner" con recurrencia (p. ej. 2 noches/mes),
   capacidad limitada y timezone `Europe/Rome`.
4. **Feature `src/features/dining/`** (kebab-case, sin barrel, archivos concretos):
   - `menu.ts` — data-access Menus V1 con `auth.elevate` + try/catch tolerante:
     `getJungleMenu()` (menú + secciones + items en display order, DTO con
     `priceInfo` normalizado) → `null` si falla.
   - `reservations.ts` — data-access Table Reservations: availability + crear
     reservation, mismo espíritu que workshops step 20: validación, timezone,
     errores tipados (`DiningReservationError`).
   - `reservation-form.tsx` — isla React: fecha/hora + party size + contacto → POST
     `/api/dining/reservations`, estados idle/submitting/success/error con
     `aria-busy`/`role="status"`/`role="alert"` y retry (patrón workshop-booking).
5. **API `src/pages/api/dining/reservations.ts`** — POST: valida inputs, consulta
   availability, crea reservation; mapea errores codificados → 400 `INVALID_INPUT`,
   409 `NO_AVAILABILITY`, 502 `RESERVATION_UNAVAILABLE`.
6. **Nav + i18n** — link `nav.dining` en `site.nav` (móvil; evaluar con Playwright
   antes de ponerlo en `site.navPrimary` ≤ 6 links sin wrapping). Teaser en home con
   la próxima sesión (patrón lookbook/blog). Claves `dining.*` + `nav.dining` en
   `en`/`es`/`it` (`src/translations.json` + seeds es/it).
7. **Analytics bajo consent** — `CustomEvent` "DiningReservation" (sin PII) solo con
   `hasAnalyticsConsent` (patrón step 35).
8. **Tests** — unit: `tests/features/dining/menu.test.ts` (orden display, precios,
   null-fallback) + `reservations.test.ts` (validación/timezone/errores) + isla;
   E2E `tests/e2e/dining.spec.ts` — `/dining` 200 con secciones/precios seeded, form
   visible, caso sin disponibilidad → copy degenerado ("next date TBA"), `/es/dining`
   localizado. Assertear solo lo que el repo controla.

## Pages / Sections

- `src/pages/dining.astro` — hero de la experiencia (próxima fecha), menú display-only
  (secciones → items con precio), detalles de la experiencia e isla de reserva.
- Si el diseño se siente pesado, dividir `/dining` (experiencia + reserva) y
  `/dining/menu` — decidir al verlo, no crear rutas a priori.

## Design

- Tokens del sistema (fondo `paper-warm`, énfasis `accent`); menú tipo carta con
  tipografía display (Fraunces) para los platos; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.

## Wix wiring

- Queries Menus V1 y Table Reservations con `auth.elevate` en runtime; IDs en
  `.wix/seeded.json` solo como apoyo, nunca importados en rutas `.astro`.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde · `npm run check` 0 errores · `npm test` verde · `npm run test:e2e` en verde
- [ ] `/dining` 200 con el menú "Jungle Tasting" seeded (secciones + precios legibles) y la isla de reserva hidratada
- [ ] Reserva real en `wix dev` contra una availability seeded; cancelar la reserva de prueba al terminar (sitio limpio, como step 20)
- [ ] Sin availability sembrada la página no se rompe (copy "next date TBA")
- [ ] Hallazgos + IDs seeded en la sección `## Resultado` de este archivo (fila 44 del ROADMAP corta, ver AGENTS.md)

## Al terminar

1. Marca el paso 44 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/generate-next-steps` (o el paso que el propietario pida).
