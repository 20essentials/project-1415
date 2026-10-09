---
description: Step 7 — Cart + checkout nativo Wix · Petals & Predators
---
# Step 7 — Cart + checkout nativo Wix

> **Siguiente:** `/step-8-create-about-and-contact`

## Objetivo

Carrito funcional con controles de cantidad y subtotal, badge de contador en la
navbar, y checkout redirigiendo al checkout alojado de Wix + página de agradecimiento.

## Contexto

- **Marca:** Petals & Predators — sitio en inglés.
- **Guía:** `C:\Users\amoil\.agents\skills\wix-headless\references\ecom\INSTRUCTIONS.md`
  · **Templates base:** `references\astro\templates\ecom\` (`cart.astro`, `CartView.tsx`,
  `CartBadge.tsx`, `thank-you.astro`; `discounts.ts` ya está en `src/utils/`).
- **Datos:** Current Cart API (`@wix/ecom`); el carrito vive en Wix (no en localStorage).
- **Comandos:** !`ls .opencode/commands` · **Páginas hoy:** !`ls src/pages 2>/dev/null`

## Functionality

1. **`src/pages/cart.astro` + `src/components/CartView.tsx`** — line items (imagen,
   nombre, variante, precio unitario), controles de cantidad (+/− con límites del
   stock), remove, subtotal, nota "Shipping calculated at checkout", botón
   **"Check out securely"** → `navigateToCheckout()` (checkout alojado de Wix —
   no construyas checkout propio), y "Continue shopping" → `/products`.
2. **Estado vacío** — "Your cart is empty" + CTA a `/products`.
3. **`src/components/CartBadge.tsx` en la navbar** — montar en
   `src/components/Navigation.astro` **en el marker `<!-- nav:actions -->`**:
   icono de carrito con contador (actualiza en vivo con la Current Cart API),
   `aria-label="Cart, N items"`, link a `/cart`.
4. **`src/pages/thank-you.astro`** — confirmación post-compra (pedido, resumen,
   "Continue shopping"). El redirige aquí lo maneja el checkout de Wix
   (verifica la ruta en `wix.config.json`/ecom setup según la guía).
5. **Descuento** — campo opcional de código con `src/utils/discounts.ts` si la guía lo cubre.

## Design

- Vista de carrito: filas con `border-b rule`, imagen 80px `radius 6px`, stepper
  `border rule radius 4px`, subtotal destacado Inter 500.
- CTA checkout: `bg accent text paper radius 4px`, full-width en móvil.
- Badge: contador pill `bg accent text paper` sobre el icono; hover 0.2s.
- Estados loading/empty/error en `mute`. Focus-visible `accent`.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Añadir desde un PDP → el badge de la nav muestra el contador correcto
- [ ] Cambiar cantidad actualiza subtotal; remove vacía el carrito (estado vacío ok)
- [ ] "Check out securely" abre el checkout de Wix con los items
- [ ] Tras compra de prueba, `/thank-you` renderiza

## Al terminar

1. Marca el paso 7 como `done` en `ROADMAP.md`.
2. Siguiente: `/step-8-create-about-and-contact`
