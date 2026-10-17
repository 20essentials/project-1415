---
description: Step 26 — Cupones/promo en el carrito · Petals & Predators
---
# Step 26 — Cupones/promo en el carrito

> **Siguiente:** `/step-27-write-product-review` (si aún no existe → `/generate-next-steps`)

## Objetivo

El carrito acepta un código de cupón: se aplica al carrito actual de Wix, muestra el descuento y el total actualizado, permite quitarlo y traduce los errores de la API (código inválido, expirado, ya aplicado) a mensajes claros.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/cart/` (`cart-view.tsx`, `cart-badge.tsx`, `discounts.ts`), `src/pages/cart.astro`, `src/shared/analytics.ts`, `src/translations.json`, `ROADMAP.md`.
- **API (verificada en `node_modules/@wix/auto_sdk_ecom_cart-v-2`):** `currentCart.addCouponToCurrentCart({ coupon: { code } })` y `currentCart.removeCouponFromCurrentCart({ couponId })`; ambos devuelven `{ cart }`. El carrito trae `coupons: V2Coupon[]` (`_id`, `code`) y `summary: CartSummary` con `discounts?: Discount[]` (cada uno con `couponCode`/`couponId` según corresponda) y montos. Solo se soporta **un** cupón por carrito. Los errores de aplicación llegan como `applicationError.code` (`INVALID_COUPON_CODE`, `COUPON_NOT_FOUND_IN_CART`, `COUPON_ALREADY_EXISTS`, `INVALID_COUPON_STATUS`, y el caso "cupón no aplicable a gift cards").

## Functionality

1. **Mensajes de error puros — `src/features/cart/coupon-messages.ts`** (sin React, testeable)
   - `export type CouponErrorCode = 'INVALID_COUPON_CODE' | 'COUPON_NOT_FOUND_IN_CART' | 'COUPON_ALREADY_EXISTS' | 'INVALID_COUPON_STATUS' | 'COUPON_GIFT_CARD' | 'NETWORK' | 'UNKNOWN'`.
   - `export interface CouponMessages { invalid; expired; already; giftCard; network; unknown }` (textos ya traducidos que pasa la página).
   - `export function couponErrorCode(error: unknown): CouponErrorCode` — lee `error.details.applicationError.code` (mismo patrón que `src/pages/api/bookings.ts`) y mapea; sin código reconocible → `NETWORK` si es error de red, si no `UNKNOWN`.
   - `export function couponErrorMessage(code: CouponErrorCode, messages: CouponMessages): string`.
   - `export function couponDiscount(cart, couponId/code)` → helper que extrae el monto del descuento de cupón desde `summary.discounts` (para mostrar junto al código aplicado).
2. **UI en `src/features/cart/cart-view.tsx`**
   - Ampliar el tipo local `Cart` con `coupons?: Array<{ _id?: string | null; code?: string | null }> | null` y, en `summary`, `discounts?: Array<{ couponCode?: string | null; couponId?: string | null; discount?: { amount?: number | null } | null }> | null` y `total?: number | null` (ya existe `subtotal`).
   - Estado local: `couponInput`, `couponError`, `couponPending`.
   - `handleApplyCoupon()`: no-op si el input está vacío; `currentCart.addCouponToCurrentCart({ coupon: { code } })`; con `res.cart` → `setCart` + `publishCartUpdate`; error → `couponError = couponErrorMessage(couponErrorCode(err), labels.coupon)`.
   - `handleRemoveCoupon(couponId)`: `currentCart.removeCouponFromCurrentCart({ couponId })`; mismo refresh/errores.
   - Render (dentro de la sección de resumen, sobre `Subtotal`): si hay `cart.coupons[0]` → chip con el código + `−<monto>` del descuento de cupón y botón "Remove" (`aria-label` con el código); si no → `<form>` con `<label>` (sr-only/visible), `<input name="coupon" autoComplete="off">`, botón "Apply" (`disabled` mientras `couponPending` o vacío). Mensaje de error en `role="alert"`; estado aplicado en `role="status"`.
   - Mostrar `Total` cuando `summary.total` exista (hoy solo se muestra `Subtotal`): Subtotal → Discount (si hay) → Total.
   - Accesibilidad: `aria-busy` en el botón mientras aplica; no romper el foco al actualizar (no desmontar el input innecesariamente).
3. **Analytics — `src/shared/analytics.ts`**
   - Emitir `trackEvent('CustomEvent', { eventCategory: 'Cart', eventAction: 'ApplyCoupon', eventLabel: code })` solo con consentimiento (el propio wrapper ya gatea) — sin PII.
4. **i18n — `src/translations.json` + `.wix/multilingual/translations/{es,it}.json`**
   - Claves nuevas (namespace `cart.coupon.`): `cart.coupon.label`, `cart.coupon.placeholder`, `cart.coupon.apply`, `cart.coupon.applying`, `cart.coupon.applied`, `cart.coupon.remove`, `cart.coupon.invalid`, `cart.coupon.expired`, `cart.coupon.already`, `cart.coupon.gift-card`, `cart.coupon.network`, `cart.coupon.unknown`; y `cart.discount`/`cart.total` para las filas del resumen. Paridad exacta de conteo en `en`/`es`/`it`.
   - `src/pages/cart.astro` pasa los nuevos labels dentro del objeto `labels` existente (nuevo sub-objeto `coupon` + `discount`/`total`), siguiendo el patrón actual.
5. **Tests — `tests/features/cart/coupon-messages.test.ts`**
   - `couponErrorCode`: mapea cada `applicationError.code`; sin código → `UNKNOWN`/`NETWORK` según el caso; objeto raro no lanza.
   - `couponErrorMessage`: devuelve el texto correcto por código.
   - `couponDiscount`: extrae el monto del cupón de `summary.discounts`, devuelve `0`/`null` cuando no hay.

## Pages / Sections

- `src/pages/cart.astro` — sin ruta nueva; el carrito gana la fila de cupón y las filas Discount/Total (sigue `noindex`).

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`; error con `text-error`.
- Radii 4/6/12px; transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- El chip de cupón aplicado usa el mismo tratamiento que las filas del resumen (`border-t border-rule pt-*`, texto `ink-soft` para el label y `accent`/`ink` para el monto).

## Wix wiring

- `currentCart.addCouponToCurrentCart` / `currentCart.removeCouponFromCurrentCart` de `@wix/ecom` en runtime (isla cliente); el carrito actual es el del visitante — nunca pasar un `cartId` propio.
- `.wix/seeded.json` solo para slugs/IDs de apoyo (nunca importarlo en rutas `.astro`).
- No hay cupones seeded en el sitio: para verificar el camino feliz, crear un cupón de prueba con la Coupons API (`POST https://www.wixapis.com/coupons/v1/coupons`) y **borrarlo** al terminar (`DELETE https://www.wixapis.com/coupons/v1/coupons/{id}`); el camino de error (código inválido) se verifica sin datos.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde (`coupon-messages`)
- [ ] `wix dev`: `GET /cart` → 200; la isla monta el input de cupón
- [ ] Código inválido (p. ej. `NOPE`) → `role="alert"` con el mensaje de inválido, sin crash ni pérdida de los line items
- [ ] Cupón de prueba válido → chip aplicado + fila Discount + Total; "Remove" lo quita y vuelve el resumen sin descuento
- [ ] El carrito vacío sigue mostrando el estado vacío sin el bloque de cupón roto
- [ ] `ApplyCoupon` visible en la red solo con consentimiento (no en la carga inicial sin decisión)
- [ ] Claves `cart.coupon.*` en `en`/`es`/`it` con el mismo conteo y `/es/cart` muestra los textos localizados

## Al terminar

1. Marca el paso 26 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-27-write-product-review` (o `/generate-next-steps`).
