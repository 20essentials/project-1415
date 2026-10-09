---
description: Step 6 — Product detail page · Petals & Predators
---
# Step 6 — Product detail page

> **Siguiente:** `/step-7-create-cart-and-checkout`

## Objetivo

`/products/[slug]` completa: galería, nombre, descripción, precio, selector de
variantes, cantidad y add-to-cart — lista para conectar el carrito en step-7.

## Contexto

- **Marca:** Petals & Predators — sitio en inglés.
- **Guía:** `C:\Users\amoil\.agents\skills\wix-headless\references\astro\stores\PRODUCT_PAGES.md`
  + `SHARED_WIRING.md` · **Templates base:** `references\astro\templates\stores\products\`,
  `AddToCartButton.tsx`, `ProductPurchase.tsx`.
- **Datos:** `.wix/seeded.json → stores.products` (slugs + `variantId` para
  `getStaticPaths`); detalle y stock en runtime vía `@wix/stores`.
- **Cart:** `@wix/ecom` (Current Cart API) — el add-to-cart escribe el carrito;
  la UI de carrito llega en step-7.
- **Comandos:** !`ls .opencode/commands` · **Páginas hoy:** !`ls src/pages 2>/dev/null`

## Functionality

1. **`src/pages/products/[slug].astro`** — `getStaticPaths` desde el slice `stores`;
   por producto: galería de imágenes (principal + thumbs), `h1` nombre, descripción
   enriquecida, precio (o rango si hay variantes), badges ("In stock", "Ships in 48h").
2. **Selector de variantes** — opciones del producto (p.ej. Size: Small/Medium/Large
   del Nepenthes) como botones/pills; al cambiar actualiza precio y `variantId`
   seleccionado. Sin variantes → el selector no se renderiza.
3. **Selector de cantidad** — stepper con límites (1-10), botones con `aria-label`.
4. **Add-to-cart** — botón `accent` que llama a la Current Cart API con
   `{ productId, quantity, variantId }`; feedback en el botón ("Added ✓", 1.5s) +
   link a `/cart`. (El CartBadge de la nav se monta en step-7.)
5. **Breadcrumbs** All plants → categoría → producto.
6. **Related** — "You may also like": 3 productos de la misma categoría (query runtime).
7. Meta `title`/`description` por producto en el slot `head`.

## Design

- Layout: 2 columnas (galería sticky izq. / info der.) → stack en <768px.
- Pills de variante: `border rule`, activa `bg accent text paper`, `radius 4px`.
- Precio grande Inter 500; CTA full-width en móvil. Focus-visible `accent` en todo.
- Imágenes con `alt` = nombre del producto.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Cada producto sembrado tiene `/products/<slug>` y muestra precio correcto
- [ ] El Nepenthes cambia precio entre Small/Medium/Large
- [ ] Add-to-cart agrega el item (verificable con la API de carrito aunque la UI
      de carrito exista recién en step-7)

## Al terminar

1. Marca el paso 6 como `done` en `ROADMAP.md`.
2. Siguiente: `/step-7-create-cart-and-checkout`
