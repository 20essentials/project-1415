---
description: Step 33 — Restock alerts: event extension + dashboard page · Petals & Predators
---
# Step 33 — Restock alerts: event extension + dashboard page

> **Siguiente:** `/step-34-ci-cd-env-tipado`

## Objetivo

Crear una extensión de backend que escuche `wix.ecom.v1.order.approved`, lea line items, consulte inventario y gestione alertas de restock en una colección CMS `restock-alerts`. Añadir una página de dashboard con WDS para listar/filtrar y marcar alertas como resueltas. Verificar compatibilidad React 16 de dashboard extensions con React 18 del proyecto antes de codificar y registrar con `wix release`.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/`, `src/shared/`,
  `src/app/`, `src/pages/`, `.opencode/commands/`, `ROADMAP.md`, catálogo de productos/inventario.

## Functionality

1. **Colección CMS `restock-alerts`**
   - Crear/asegurar colección con campos: `productId`, `slug`, `remaining` (number), `threshold` (number), `orderId`, `status` (`pending|resolved`), timestamps.
   - Permisos/configuración acorde al uso con `auth.elevate`.

2. **Extensión de backend (event)**
   - Escuchar evento `wix.ecom.v1.order.approved` (confirmar nombre exacto en schema/docs antes de codificar).
   - Leer line items del pedido, consultar inventario por producto.
   - Escribir/actualizar entradas en `restock-alerts` con lógica idempotente por `orderId + productId`.
   - Usar `auth.elevate` donde aplique y manejo de errores/try-catch.
   - Evitar duplicados y asegurar idempotencia.

3. **Página de dashboard con WDS**
   - Crear extensión de dashboard page con `@wix/design-system`.
   - Listar alertas, filtrar por estado/producto, marcar como resueltas.
   - Verificar compatibilidad React 16 de dashboard extensions vs React 18 del proyecto **antes** de codificar.
   - Acciones seguras con elevación de permisos.

4. **Registro y verificación**
   - Probar flujo con pedido de prueba (aprobar pedido) verificando creación/actualización de alertas.
   - Verificar dashboard funciona y marca resueltas correctamente.
   - Registrar con `wix release`.

## Pages / Sections

- Dashboard page en el área de extensiones (accesible desde el dashboard de Wix).

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`,
  superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.
- Usar componentes de `@wix/design-system` en la dashboard page.

## Wix wiring

- Event extension backend.
- CMS `restock-alerts` con `auth.elevate`.
- Dashboard extension con WDS.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Compatibilidad React verificada antes de codificar dashboard
- [ ] Evento dispara y crea/actualiza alertas con idempotencia
- [ ] Dashboard lista/filtra/marca resueltas
- [ ] Extensiones registradas con `wix release`

## Al terminar

1. Marca el paso 33 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-34-ci-cd-env-tipado` (o `/generate-next-steps`).

## Resultado

Tres extensiones (registradas en `src/extensions.ts`, todas en `dist/_wix/app-manifest.json`): **DATA_COMPONENT** con la colección `restock-alerts` (`src/extensions/backend/data-collections/restock-alerts.ts`: orderId, productId, slug, remaining, threshold, status, createdDate/updatedDate; índice orderId+productId; permisos CMS_EDITOR); **WEBHOOK** `order_approved` (`orders.onOrderApproved`, scope `SCOPE.DC-STORES.READ-ORDERS`) que lee line items (filtra `catalogReference.appId === Wix Stores`), resuelve slug por `productsV3.queryProducts().in('_id',…)`, suma inventario por producto (`inventoryItemsV3.queryInventoryItems().eq('productId',…)`, `Infinity` si `trackQuantity === false`) y hace `upsertAlert` **idempotente por orderId+productId** (con `auth.elevate`); **BACK_OFFICE_PAGE** `restock-alerts` (WDS: `Tabs` pending/resolved/all + `Table`/`TableToolbar`, `Badge` de estado, botón "Mark resolved" → `resolveAlert` + `dashboard.showToast`, estados `Loader`/`EmptyState`). Lógica pura en `src/features/restock-alerts/{restock-alert,restock-alerts-repository}.ts`. (Se usan imports relativos en las extensiones porque el bundler de @wix/astro no resuelve el alias `@/`.) **Verificado:** `wix build` verde (manifest con las 3 extensiones) · `npm run check` 0 errores (120 files) · `npm test` 135/135 (19 nuevos en `tests/features/restock-alerts/`) · `wix release` OK. **No verificado:** disparo real del evento en producción (requiere una orden pagada) y render de la dashboard page en el backoffice. **Docs:** [About extensions](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/extensions/about-extensions)
