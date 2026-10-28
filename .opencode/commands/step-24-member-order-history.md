---
description: Step 24 — Historial de órdenes (miembros) · Petals & Predators
---
# Step 24 — Historial de órdenes (miembros)

> **Siguiente:** `/step-25-catalog-filters-and-sort` (si aún no existe → `/generate-next-steps`)

## Objetivo

Los miembros logueados ven su historial de órdenes de tienda (`/account/orders`) — número, fecha, estado, total y resumen de line items — consultando `orders.searchOrders()` solo en servidor, filtrado estrictamente por el comprador actual.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/account/` (barrel + `member-avatar.ts`), `src/pages/account.astro` (patrón de redirect a login + perfil), `src/features/cart/`, `.wix/seeded.json`, `ROADMAP.md`.
- **Seguridad (el riesgo que motivó el delay de este item):** no existe API member-scoped de órdenes de Stores en headless (solo Pricing Plans tiene `GET /pricing-plans/v2/member/orders`). `orders.searchOrders()` (`@wix/ecom`) es admin-level: requiere `auth.elevate()` con scope `ECOM.READ_ORDERS`. El step entero está diseñado para que ese poder **nunca salga del servidor** ni permita leer órdenes ajenas.

## Functionality

1. **Data-access — `src/features/order-history/orders.ts`** (feature nueva, Screaming Architecture)
   - `listMemberOrders(memberEmail: string)`: `auth.elevate(orders.searchOrders)` de `@wix/ecom` con:
     - `search.filter` sobre `buyerInfo.email` `$eq` el email del miembro logueado (el único filtro permitido — venir siempre de `members.getCurrentMember` en servidor, **nunca** de query params o body del cliente);
     - `search.sort`: `[{ fieldName: 'createdDate', order: 'DESC' }]`;
     - `search.paging`: `{ limit: 20 }` (una página; sin cursor en v1);
     - proyectar solo los campos que renderiza la UI: `orderNumber`, `createdDate`, `status`, `priceSummary` (subtotal/Discount/tax/shipping/total), line items (`lineItems[].title`, `quantity`, `price`, `image`), `buyerInfo.email`. No devolver el objeto Order crudo a la vista.
   - `try/catch` → `[]` (mismo patrón que `queryReviews`/`queryLookbook`); tipar con los tipos del SDK (`SearchOrdersResponse`), sin `any`.
   - Barrel `src/features/order-history/index.ts` que exporta lo público (`listMemberOrders`, tipos `MemberOrderSummary` si se define DTO propio).
2. **SSR — `src/pages/account/orders.astro`** (ruta delgada, sin lógica de negocio)
   - Al cargar: `members.getCurrentMember()`; sin miembro → `Astro.redirect` a `localize('/api/auth/login?returnToUrl=…')` (copiar el patrón de `account.astro`).
   - Con miembro → `listMemberOrders(member.loginEmail ?? member.contact?.email ?? '')`; email vacío → tratar como lista vacía.
   - `Layout noindex` (igual que `/account`).
3. **UI — `src/features/order-history/order-history-list.astro`** (componente de la feature)
   - Lista de tarjetas (`rounded-md border border-rule bg-paper-warm/40`, patrón visual de la card de perfil en `/account`): número de orden, fecha localizada (`Intl.DateTimeFormat` con `currentLanguage()`), badge de estado (`PAID`→accent, `PENDING`/`UNPAID`→mute, `CANCELED`/`REFUNDED`→tinta suave; texto del badge desde i18n), total formateado con el currency del priceSummary, y fila resumen de line items (thumbnail ≤48px con `resolveWixImage*` si hay imagen, título, qty `×N`).
   - Estado vacío: copy `order-history.empty.*` + CTA botón a `/products` (clase `btn btn-ghost`/`btn` según DESIGN.md).
   - Sin PII más allá de la que el propio miembro ya ve en `/account` (no mostrar email ni dirección de envío en la tarjeta).
4. **Navegación — `src/pages/account.astro`**
   - Añadir link "Order history" a `/account/orders` dentro de la card de perfil (junto al logout), con icono-free botón/link del tema (`text-accent hover:underline` o `btn btn-ghost`).
   - El redirect de no-logueado de `/account/orders` debe apuntar a login con `returnToUrl` localizado a `/account/orders`.
5. **i18n — `src/translations.json` + seeds**
   - Claves nuevas con namespace `order-history.*` en `en`, `es`, `it`: `title`, `empty`, `empty-cta`, `status.paid`, `status.pending`, `status-unpaid`, `status.canceled`, `status.refunded`, `status.other`, `quantity`, `back-to-account`, y `account.order-history` (label del link). Mantener el conteo de claves par entre los 3 idiomas.
6. **Tests — `tests/features/order-history/orders.test.ts`**
   - Mock de `@wix/ecom` (`vi.mock`, igual que `cart-badge`/reviews): verificar que `searchOrders` se invoca con el filtro `buyerInfo.email $eq` del email argumentado, sort DESC y limit 20; resultado mapeado al DTO; `try/catch` → `[]`; email vacío → lista vacía sin llamar a la API (o con filtro que no puede devolver nada — elegir uno y testearlo).
   - Test del componente (si aplica, `.astro` se testea vía página en e2e; priorizar el unit del data-access).

## Pages / Sections

- `src/pages/account/orders.astro` — historial de órdenes del miembro logueado (redirect a login si no lo está; `noindex`).
- `src/pages/account.astro` — editar: link "Order history" en la card de perfil.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- La página debe ser 100% SSR (sin islas React): los datos vienen del miembro actual en el request; no hay interacción que justifique hidratación en v1.

## Wix wiring

- `members.getCurrentMember()` (SDK `@wix/members`, auth ambient del sitio) + `orders.searchOrders()` de `@wix/ecom` con `auth.elevate()` **solo dentro de** `src/features/order-history/orders.ts` (código servidor; nunca importar desde un `.tsx` cliente).
- `.wix/seeded.json` solo para slugs/IDs de apoyo (nunca importarlo en rutas `.astro`).
- Gotcha conocido del roadmap: las órdenes de test hechas como guest no tienen `buyerInfo` de miembro — para verificar con datos, loguearse como miembro y completar un checkout, o crear una orden de prueba vía dashboard con el email del miembro.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde (tests nuevos de `order-history`)
- [ ] `wix dev`: `/account/orders` sin sesión → 302 a `/api/auth/login` con `returnToUrl` correcto
- [ ] Con miembro logueado → 200; órdenes propias listadas (número, fecha, estado, total, line items); sin órdenes → estado vacío con CTA
- [ ] Ninguna llamada a `searchOrders` con filtro distinto de `buyerInfo.email` del miembro actual (revisar el código: el email no llega de params del cliente)
- [ ] `/account` muestra el link "Order history" y navega correctamente
- [ ] Claves `order-history.*` presentes en `en`/`es`/`it` y la página se localiza (`/es/account/orders`)

## Al terminar

1. Marca el paso 24 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/generate-next-steps`.

## Resultado

Mitigación del riesgo de seguridad: `orders.searchOrders()` con `auth.elevate()` vive solo en `src/features/order-history/orders.ts` (código servidor), filtrando siempre por `buyerInfo.email` del miembro actual (`members.getCurrentMember()`), nunca por params del cliente. Feature `order-history`: `orders.ts` (`listMemberOrders(email)` con `OrderSearch` del SDK, `filter: {'buyerInfo.email': {$eq}}`, `sort: [{fieldName:'_createdDate', order:'DESC'}]`, `cursorPaging:{limit:20}`; email vacío → `[]` sin llamar a la API; error → `try/catch`→`[]`) + `order-history-list.astro` (tarjeta con nº/fecha/estado/total, line items con thumb 48px, estado vacío con CTA a `/products`) + `src/pages/account/orders.astro` (`noindex`, 302 a login con `returnToUrl=/account/orders`; email del miembro con fallback `loginEmail ?? contact?.emails?.[0] ?? ''` — `Contact.email` no existe, es `emails: string[]`) + link "Order history" en `/account` junto al logout. Sin barrel de feature (AGENTS.md regla 1: cada feature expone archivos concretos; el resto importa `@/features/order-history/orders`). 12 claves `order-history.*` + `account.order-history` → 375 claves por idioma (paridad en/es/it verificada). **Desviación del step:** el campo sortable real es `_createdDate` — `OrderSearchSpec.wql` no lista `createdDate` en el union de `sort` (aunque la API responde 200 a ambos), así que `createdDate` no compilaba ni ordenaba. **Verificado:** `npm run check` 0 errores · `npm test` 48/48 (4 nuevos en `tests/features/order-history/orders.test.ts`) · `npx @wix/cli@latest build` verde · `npm run test:e2e` 9/9 · curl en `wix dev`: `/account/orders`, `/es/account/orders`, `/it/account/orders` → 302 con `returnToUrl` localizado. **No verificado (sin credenciales de miembro ni órdenes en el sitio — `ecom: skipped` en `.wix/seeded.json`):** 200 con sesión, render de órdenes/estado vacío y el link desde `/account`
