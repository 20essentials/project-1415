---
description: Step 5 — Shop + páginas de categoría · Petals & Predators
---
# Step 5 — Shop + páginas de categoría

> **Siguiente:** `/step-6-create-product-detail`

## Objetivo

El catálogo navegable: grid de productos en `/products`, páginas de categoría en
`/category/[slug]` con rail de filtros, y los links del nav activándose por fin.

## Contexto

- **Marca:** Petals & Predators — sitio en inglés.
- **Guía:** `C:\Users\amoil\.agents\skills\wix-headless\references\astro\stores\CATEGORY_PAGES.md`
  + `SHARED_WIRING.md` · **Templates base** (adaptar, no copiar crudo):
  `references\astro\templates\stores\CategoryRail.astro`, `ProductCard.astro`,
  `categories.ts` (ya en `src/utils/`).
- **Datos:** `.wix/seeded.json → stores` (slugs/IDs para `getStaticPaths`); queries
  `@wix/stores` en runtime.
- **Comandos:** !`ls .opencode/commands` · **Páginas hoy:** !`ls src/pages 2>/dev/null`

## Functionality

1. **`src/pages/products/index.astro`** — "All plants": grid con ProductCard
   (imagen, nombre, precio, link), query de todos los productos publicados.
2. **`src/pages/category/[slug].astro`** — `getStaticPaths` desde
   `stores.categoryIds` (carnivorous, flowers, kits-accessories); título de
   categoría, lede, grid filtrado por categoría.
3. **`src/components/CategoryRail.astro`** — pills "All / Carnivorous / Flowers /
   Kits & Accessories" con `aria-current` (el script de `layout.astro` ya lo
   sincroniza en `/products` y `/category/*` — no re-implementarlo, solo usar los
   atributos `data-category-rail` / `data-category-slug`).
4. **`src/components/ProductCard.astro`** — componente único reutilizado por home
   y shop (si el de step-4 es inline, extráelo y reutiliza).
5. Volver navegables: los links del nav (`Shop`, `Carnivorous`, `Flowers`) y los
   CTAs del home y footer.
6. Estado vacío por categoría (copy cálido, link a `/products`).

## Design

- Cards: `bg paper-warm`, `border rule`, `radius 6px`, padding 16px, hover 0.2s.
- Rail: pills `radius 999px`, activa `bg accent` / `text paper`, inactivas `border rule`.
- Precio: Inter 500; nombre: Inter 500 16px `ink`; muted: `mute`.
- Grid 1→2→3/4 columnas (640/768/1024). `alt` por imagen.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `/products` lista los 5 productos sembrados
- [ ] Cada `/category/<slug>` renderiza solo su categoría y el pill queda `aria-current`
- [ ] Nav Shop/Carnivorous/Flowers + home + footer navegan correctamente
- [ ] URLs inexistentes → 404 controlado

## Al terminar

1. Marca el paso 5 como `done` en `ROADMAP.md`.
2. Siguiente: `/step-6-create-product-detail`
