---
description: Step 4 — Home page completa · Petals & Predators
---
# Step 4 — Home page completa

> **Siguiente:** `/step-5-create-shop-page`

## Objetivo

Convertir `src/pages/index.astro` (solo hero) en una home completa: value props,
categorías, productos destacados, testimonios y CTA final — todo con datos reales del SDK.

## Contexto

- **Marca:** Petals & Predators — sitio en inglés.
- **Design system:** `DESIGN.md` + tokens en `.wix/design-tokens.css` / `src/styles/global.css`.
- **Datos:** leer slice `stores` de `.wix/seeded.json` (solo para slugs/IDs de apoyo —
  **las queries al SDK van en runtime, no importar seeded.json en la ruta**).
- **Comandos:** !`ls .opencode/commands` · **Secciones actuales del home:** !`grep -o 'home:[a-z-]*' src/pages/index.astro 2>/dev/null | sort -u || echo "(revisar markers)"`

## Functionality

Secciones, en orden, sobre el hero existente:

1. **Value props** (fila de 3-4, iconos SVG inline): "Greenhouse-grown, shipped alive" ·
   "30-day arrival guarantee" · "Care guide included with every plant" ·
   "Fast live-plant shipping".
2. **Shop by category** — 3 cards (Carnivorous / Flowers / Kits & Accessories) con
   imagen o bloque tokenizado, título y link a `/category/<slug>` (slugs de
   `.wix/seeded.json → stores.categoryIds`).
3. **Featured plants** — grid de 4-6 productos: query `@wix/stores` en runtime
   (frontmatter SSR), `ProductCard`-ligero propio (imagen, nombre, precio, link a
   `/products/<slug>`). Si el slice aún no tiene datos → muestra el estado vacío con
   copy, nunca un crash.
4. **Testimonios** — 2-3 citas estáticas de growers (inventar nombres/plantas
   creíbles, inglés, tono cálido).
5. **CTA final** — banner `paper-warm` con headline Fraunces + botón "Shop all plants" → `/products`.

- Respeta/coloca los markers `<!-- home:stores -->` y `<!-- home:gift-cards -->` donde
  componga el Composer (no los borres — steps futuros los parchean).

## Design

- Tokens: cards `bg paper-warm` + `border rule` + `radius 6px`; gaps 24px; secciones
  `py-16/24`; headings de sección Fraunces o Inter 500 36px `tracking -0.72px`.
- Hover de card: `translateY(-2px)` + borde `accent`, 0.2s `cubic-bezier(.4,0,.2,1)`.
- Grid responsive: 1 col móvil → 2 (640px) → 4 (1024px). Imágenes con `alt` descriptivo.
- A11y: headings en orden (`h1` solo en hero), links con texto visible, focus-visible.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Featured muestra los productos sembrados (o estado vacío si no hay seed)
- [ ] Cada card de categoría lleva a su `/category/<slug>` correcto
- [ ] Responsive en 375px / 768px / 1280px sin overflow

## Al terminar

1. Marca el paso 4 como `done` en `ROADMAP.md`.
2. Siguiente: `/step-5-create-shop-page`
