---
description: Step 30 — Gift Cards: app oficial + compra real · Petals & Predators
---
# Step 30 — Gift Cards: app oficial + compra real

> **Siguiente:** `/step-31-performance-post-release` (si aún no existe → `/generate-next-steps`)

## Objetivo

Con la app **Wix Gift Cards** ya instalada, `/gift-cards` deja de depender del probe REST y lee el producto "eGift Card" por el SDK; se verifica el flujo real de compra (añadir al carrito + checkout) y se mantiene el fallback cuando no hay producto.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/gift-cards/gift-cards.ts` (`getGiftCardProduct()` — probe REST `POST /gift-cards/v1/gift-card-products/query` con `httpClient.fetchWithAuth`, memoizado), `src/features/gift-cards/gift-card-purchase.tsx` (`currentCart.addToCurrentCart` con `catalogReference` + `giftingInfo`), `src/pages/gift-cards.astro`, `.wix/seeded.json` (bloque `gift-cards`).
- **App ya instalada (AGENTS.md + `.wix/seeded.json`):** `appDefId` `d80111c5-a0f4-47a8-b63a-65b54d774a27`, instancia `457bf786-625b-4ca7-93a4-3fdd5878d1e2`, producto **"eGift Card"** `34e53e4e-a329-4aef-b4b2-6f4350f944e2` con 5 preset variants. **No** reinstalar si ya está.
- **API (verificar en `node_modules/@wix/auto_sdk_stores_products-v-3` y `node_modules/@wix/ecom`):** el producto del gift card vive en el catálogo con `appId` de la app. Confirmar el método SDK correcto para leerlo (`products.queryProducts` filtrando por el `appId`/`id`, o el paquete que exponga el catálogo de gift cards) antes de escribir código — no asumir el shape.

## Functionality

1. **Confirmar la instalación (sin gastar calls de más si ya está)**
   - Verificar con una lectura (o confiar en `.wix/seeded.json`); si faltara, instalar con `POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install` body `{ "tenant": { "tenantType": "SITE", "id": SITE_ID }, "appInstance": { "appDefId": "d80111c5-a0f4-47a8-b63a-65b54d774a27" } }` y reintentar con backoff (propagación).
2. **`src/features/gift-cards/gift-cards.ts` — sustituir el probe por el SDK**
   - Reescribir `getGiftCardProduct()` para resolver el producto por el **SDK** en lugar del `httpClient.fetchWithAuth` REST; mantener la **misma** interfaz pública (`GiftCardProduct`, `presetVariants`, `GiftCardImage`, `WIX_GIFT_CARDS_APP_ID`) para no tocar `gift-card-purchase.tsx` ni `gift-cards.astro`.
   - Mapear el producto del SDK al shape `GiftCardProduct` (id, name, description, image, `presetVariants[].{id, price:{amount,formattedAmount}, value:{amount,formattedAmount}}`).
   - Mantener memoización a nivel módulo y el `try/catch` → `null` (fallback intacto: `/gift-cards` sigue mostrando las 3 tarjetas informativas + CTA si no hay producto).
   - Si el SDK no expone ese catálogo de otra forma que REST, **documentarlo** (comentario de una línea con el por qué) y dejar el probe, en vez de inventar un método.
3. **`src/pages/gift-cards.astro`** — sin cambios estructurales; valida que sigue 200 en ambos caminos (con producto y sin).
4. **Verificación real de compra** (con datos sembrados; sin PII en el repo)
   - Añadir el gift card al carrito vía el flujo de la página (o `POST` equivalente) con un destinatario de prueba y confirmar que `addToCurrentCart` devuelve el carrito con el line item del gift card (`appId` + `catalogItemId` + `giftingInfo`).
   - Si el checkout hosted permite un pedido de prueba sin pago real, completarlo y confirmar el estado; **si no**, dejar el flujo verificado hasta "line item en el carrito" y anotarlo explícitamente como no verificado hasta el pago.
5. **`.wix/seeded.json`** — mantener/actualizar el bloque `gift-cards` (IDs de app, instancia, producto, variants); nunca importarlo en rutas `.astro`.
6. **Tests — `tests/features/gift-cards/gift-cards.test.ts`**
   - `vi.mock` del paquete SDK; `getGiftCardProduct` con producto → mapea variants/imagen correctamente; sin producto → `null`; error del SDK → `null` (no lanza). Resetear la memoización entre tests (`vi.resetModules`) si hace falta.

## Pages / Sections

- `src/pages/gift-cards.astro` — sin ruta nueva; el hero+form (con producto) y el fallback informativo se mantienen.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`.
- Sin cambios de diseño en este paso (es de integración); respetar el lenguaje existente de la página.

## Wix wiring

- La lectura del producto del gift card pasa del probe REST al SDK en `src/features/gift-cards/gift-cards.ts` (server, memoizado). El `WIX_GIFT_CARDS_APP_ID` sigue saliendo de `.wix/seeded.json` (registrado como const en el módulo).
- `currentCart.addToCurrentCart` (isla cliente) sin cambios; el `catalogReference` ya usa el `appId` de gift cards + `giftingInfo`.
- `.wix/seeded.json` solo para IDs de apoyo (nunca importado en rutas `.astro`).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde (`gift-cards`)
- [ ] `wix dev`: `GET /gift-cards` → 200 con el hero + formulario (producto encontrado por el SDK) y, forzando `null`, el fallback informativo 200
- [ ] El formulario lista las 5 presets con su precio formateado y el botón refleja el importe elegido
- [ ] Añadir al carrito un gift card de prueba → line item presente con `appId`/`catalogItemId`/`giftingInfo`; `GET /cart` → 200
- [ ] El evento `AddToCart` sigue emitiéndose (solo con consentimiento)
- [ ] Nota en el reporte: hasta dónde llegó la compra real verificada (carrito vs. pedido pagado) y por qué

## Al terminar

1. Marca el paso 30 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-31-performance-post-release` (o `/generate-next-steps`).
