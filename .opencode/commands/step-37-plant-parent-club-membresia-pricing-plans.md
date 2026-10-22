---
description: Step 37 — Plant Parent Club: membresía con Pricing Plans · Petals & Predators
---
# Step 37 — Plant Parent Club: membresía con Pricing Plans + contenido gated

> **Siguiente:** `/step-38-loyalty-puntos-y-recompensas` (si aún no existe → `/generate-next-steps`)

## Objetivo

Existir como membresía real: `/club` muestra los planes mensual/anual, la compra pasa por el checkout hosted de Wix Pricing Plans, el estado de membresía aparece en `/account`, y las guías premium del journal quedan gated para miembros. Las guías gratuitas y el resto del sitio no cambian.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/pages/journal/index.astro`,
  `src/pages/journal/[slug].astro`, `src/features/journal/journal.ts` (colección
  `care-guides` + `queryGuides`), `src/pages/account.astro`, `src/pages/api/`,
  `src/pages/services/[slug].astro`, `.wix/seeded.json`, `src/extensions/` (Data Collections),
  `.opencode/commands/step-32-*.md` (schemas CMS como código).
- **Prerrequisitos de negocio:** app **Wix Pricing Plans** instalada y pagos online activos.
  Resolver el `appDefId` en la tabla oficial *Apps Created by Wix* (nunca adivinarlo); si no
  aparece, buscarlo con Market Listings. Si la instalación falla por falta de plan/permiso,
  detenerse y pedir intervención en dashboard en vez de inventar IDs.
- **API (confirmar antes de codificar):** `@wix/pricing-plans` — métodos reales para listar
  planes (`queryPlans`/`listPlans`), leer membresías del miembro actual (`listMemberships`/
  `getCurrentMember`-equivalent) y crear el redirect con `paidPlansCheckout`. Leer el schema con
  `SearchWixAPISpec`; **no** asumir nombres ni shapes.

## Functionality

1. **Instalar la app (sin chequear antes si ya está)**
   - `POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install` con
     `{ tenant: { tenantType: 'SITE', id: SITE_ID }, appInstance: { appDefId } }`.
   - Reintentar con backoff (1s, 2s, 4s) tras la instalación por propagación.
   - Añadir el paquete SDK (`@wix/pricing-plans` o el nombre real que publique Wix) a deps.
   - Registrar el resultado en `.wix/seeded.json` bajo `club` (planIds, appDefId, instancia).
2. **Crear los planes por API**
   - Plan mensual y anual "Plant Parent Club" (nombre, descripción, precio, moneda, ciclo,
     perks en la descripción) vía la API de Pricing Plans.
   - Idempotencia: si el plan con ese nombre ya existe, no duplicarlo.
   - Documentar los IDs resultantes en `.wix/seeded.json` (solo apoyo, nunca importado en `.astro`).
3. **`src/features/club/plans.ts` (nuevo)**
   - `listClubPlans(): Promise<ClubPlan[]>` — query de planes visibles, orden mensual → anual;
     DTO plano `{ id, name, description, price: { amount, formattedAmount, currency },
     billingCycle, perks: string[] }`. `try/catch` → `[]` (la página cae a estado informativo).
   - `getClubPlanById(id)` para el endpoint de checkout.
4. **`src/features/club/membership.ts` (nuevo)**
   - `getMemberMembership(memberId)` — consulta membresías del miembro y devuelve
     `{ active: boolean, planName, status, endDate } | null`; nunca lanza (try/catch → null).
   - `isClubMember(member)` como helper server-side reutilizable por el gate del journal.
5. **`src/features/club/plan-checkout.tsx` (isla `client:idle`)**
   - Botón por plan → `POST /api/club/checkout` con `planId`; si responde `checkoutUrl`,
     `window.location.assign`. Estados idle/submitting (`aria-busy`)/error (`role="alert"`) con
     retry; para no-miembros el CTA invita a crear cuenta (`/api/auth/login?returnToUrl=/club`).
6. **`src/pages/api/club/checkout.ts`**
   - Valida `planId` contra `getClubPlanById` (400 si no existe).
   - `redirects.createRedirectSession({ paidPlansCheckout: { planId }, callbacks: { postFlowUrl,
     thankYouPageUrl }, preferences: { additionalQueryParameters: { lang } } })`; devuelve
     `{ checkoutUrl }`. Sin `fullUrl` → 502 `CHECKOUT_UNAVAILABLE`.
   - `postFlowUrl` → `/club?checkout=cancelled`; `thankYouPageUrl` → `/club/welcome`.
7. **`src/pages/club.astro`**
   - Hero de marca (eyebrow + título + intro), grid de 2 planes, perks, CTA; miembro activo ve
     su plan y fecha de renovación en vez de las CTAs de compra.
   - Banner `role="status"` para `?checkout=cancelled`. `noindex` no hace falta: es landing.
8. **`src/pages/club/welcome.astro`**
   - Lee `planOrderId` (sin PII), confirma la activación y enlaza a `/journal` + `/account`.
     200 aunque falte el param (estado informativo).
9. **Gate de contenido premium**
   - Añadir el campo booleano `premium` a la colección `care-guides` **como código** (extensión
     de Data Collections, patrón step 32) y migrar sin perder datos; actualizar el seed.
   - `CareGuide.premium` en `src/features/journal/journal.ts`.
   - `src/pages/journal/[slug].astro`: si `premium` y no hay membresía → mostrar intro + cover +
     paywall (`<h2>` + copy + CTA a `/club`), sin renderizar `body`. Miembros y guías gratuitas
     se renderizan como hoy.
   - `src/pages/journal/index.astro`: badge "Members" en las tarjetas premium.
10. **`src/pages/account.astro`**
    - Bloque "Plant Parent Club": estado (activo / no activo), plan y fecha; link a `/club`.
11. **Descuento en workshops (alcance acotado)**
    - Mostrar el perk de miembro en `/services/[slug]` junto al precio. **No** mutar el precio
      por API si Bookings no lo soporta: dejar el descuento como beneficio canjeable y
      documentarlo como tradeoff aceptado en el reporte del paso.
12. **i18n** — namespace `club.*`, `journal.premium.*`, `account.club` en `en`/`es`/`it`
    (paridad exacta de conteo).
13. **Tests**
    - `tests/features/club/plans.test.ts` (mapper + error → `[]`).
    - `tests/features/club/membership.test.ts` (activo, expirado, sin membresía, excepción).
    - `tests/features/club/journal-gate.test.ts` (premium + no miembro → gated; miembro → body;
       gratuito → body).
    - E2E: `/club` 200 con planes, `/club` anónimo y logueado, gate del journal (200 + no body),
      `/club/welcome` sin params 200.

## Pages / Sections

- `src/pages/club.astro` — landing de planes + estado de membresía.
- `src/pages/club/welcome.astro` — confirmación de compra.
- `src/pages/journal/[slug].astro` — paywall de guías premium.
- `src/pages/account.astro` — bloque de membresía.
- `src/pages/api/club/checkout.ts` — creación del redirect session.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`,
  superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.
- Plan anual destacado con `border-accent/40`; paywall con `bg-paper-warm` y borde `rule`,
  sin degradados ni urgencia falsa.

## Wix wiring

- `@wix/pricing-plans` (SDK oficial) para planes y membresías; `@wix/redirects` para el checkout.
- Gate siempre server-side (`isClubMember` en el frontmatter de la página), nunca solo en cliente.
- `.wix/seeded.json` solo para `planId`/`appDefId` de apoyo; prohibido importarlo en `.astro`.
- Instalación y creación de planes por REST/API; el dashboard solo para pagos y perks que la API
  no cubra (documentarlo si aplica).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde
- [ ] `GET /club` → 200 con 2 planes y precios formateados (o estado informativo si la app no está lista, documentado)
- [ ] `POST /api/club/checkout` con `planId` válido → `checkoutUrl`; inválido → 400
- [ ] `?checkout=cancelled` muestra el banner; `/club/welcome` 200 con y sin `planOrderId`
- [ ] Guía premium sin membresía → paywall sin body; como miembro → body completo
- [ ] Guía gratuita se ve igual que antes del paso
- [ ] `/account` muestra el estado de membresía
- [ ] Paridad de claves i18n en/es/it

## Al terminar

1. Marca el paso 37 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-38-loyalty-puntos-y-recompensas` (o `/generate-next-steps`).
