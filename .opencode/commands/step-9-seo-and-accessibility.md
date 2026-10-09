---
description: Step 9 — SEO + accesibilidad + polish · Petals & Predators
---
# Step 9 — SEO + accesibilidad + polish

> **Siguiente:** `/step-10-build-and-release`

## Objetivo

Pulir transversalmente todas las páginas: metadatos y social cards, indexabilidad,
alt de imágenes, navegación por teclado, contraste y comportamiento responsive/motion.

## Contexto

- **Marca:** Petals & Predators — sitio en inglés.
- **Design system:** `DESIGN.md` (motion 0.2s `cubic-bezier(.4,0,.2,1)`; respeta
  `prefers-reduced-motion`).
- **Comandos:** !`ls .opencode/commands` · **Páginas a auditar:** !`ls src/pages 2>/dev/null` (recursivo con `find src/pages -name "*.astro"`)

## Functionality

### SEO

1. **`title` + `description` por página** vía los Props de `layout.astro`
   (home, shop, categoría, PDP, cart, about, contact) — único `h1` por página.
2. **Open Graph / Twitter** (`og:title`, `og:description`, `og:image` con imagen
   real 1200×630 si existe, `twitter:card`) + `<link rel="canonical">`.
3. **`src/robots.txt`** (allow `/`, disallow `/cart`, `/thank-you`) y
   **sitemap**: si `@astrojs/sitemap` se integra limpio en `astro.config.mjs`,
   úsalo; si no, deja el sitemap manual de las rutas canónicas en `public/sitemap.xml`.
4. **Favicon** — reemplazar el data-uri vacío de `layout.astro` con un SVG hoja/❀ en
   `public/favicon.svg`.
5. Descripciones en inglés, <160 chars, con keywords naturales (carnivorous plants,
   rare plants, buy flowers online).

### Accesibilidad

6. **Auditoría de `alt`** — toda `<img>` con alt descriptivo (nada de `alt=""` en
   contenido; decorativas → `alt=""` + `aria-hidden`).
7. **Orden de headings** sin saltos; landmarks (`header/main/footer`) correctos.
8. **Teclado:** menú móvil (abrir/cerrar/Escape, `aria-expanded`), category rail,
   stepper de cantidad, variantes, carrito — todo con focus-visible `accent` y
   order lógico de tabulación.
9. **Contraste AA** — pares texto/fondo de los tokens (`ink`/`paper` ok;
   revisar `mute` sobre `paper-warm` y `accent` como texto).

### Comportamiento

10. **`prefers-reduced-motion`** — anular transforms/transiciones no esenciales.
11. **Responsive sweep** en 375 / 768 / 1024 / 1280 px: nav, grids, PDP, carrito,
    footer — sin overflow horizontal ni texto cortado.
12. Meta viewport y `lang="en"` correctos (verificar en `layout.astro`).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Cada página tiene title/description únicos y un solo `h1`
- [ ] Auditar con búsqueda: `grep -rn "<img" src/ | grep -v "alt="` → sin resultados
- [ ] Navegación completa con teclado (Tab/Enter/Escape) sin trampas de foco
- [ ] Sin scroll horizontal en 375px

## Al terminar

1. Marca el paso 9 como `done` en `ROADMAP.md`.
2. Siguiente: `/step-10-build-and-release`
