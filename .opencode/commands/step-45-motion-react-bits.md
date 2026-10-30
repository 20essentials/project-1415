---
description: Step 45 — Motion React Bits (sutil + performante) — shared/motion + card hover · Petals & Predators
---
# Step 45 — Motion React Bits (sutil + performante)

> **Siguiente:** `/generate-next-steps` (o el paso que el propietario pida)

## Objetivo

Incorporar el espíritu de **React Bits** (reactbits.dev) sin dependencias nuevas:
portar 7 primitivas de movimiento como código propio (CSS + IntersectionObserver +
hooks puros) en `src/shared/motion/`, y aplicarlas en las páginas clave: home,
catálogo, PDP y lookbook. Nivel "sutil + performante", respetando siempre
`prefers-reduced-motion`.

## Contexto

- **Decisión del propietario:** React Bits confirmado; estilo sutil (sin
  framer-motion/gsap/ogl); solo páginas clave (home, catálogo, PDP, lookbook).
- **Arquitectura:** primitivas cross-feature → `src/shared/motion/` (regla "2+
  features → shared"). El hover de las tarjetas es específico de catálogo →
  `src/features/product-catalog/`. Sin barrels: archivos concretos, exports
  nombrados. `CardHover` es una única isla `client:idle` por página que escucha
  `pointermove` en `window` y escribe variables CSS en `[data-product-card]`
  (una isla por toda la grilla, no N islas por tarjeta).
- **CSS:** `motion.css` usafe selectors `data-motion~="..."` (plain CSS, sin
  @apply). Tokens de `global.css` (`--color-accent`, `--ease-fluid`, …) vía
  `var()`. `@layer motion` + bloque `@media (prefers-reduced-motion: reduce)`
  que congela/oculta cada efecto.
- **Islas:** `client:visible` casi siempre; `client:idle` para `CardHover`.
  Textos animados renderizan SSR dentro del island (SEO intacto). `Reveal` es
  "lazy-invisible": el HTML SSR sale visible y solo JS (por debajo del fold +
  JS activo) puede ocultarlo — no-JS nunca esconde contenido.

## Componentes creados

| Archivo | Efecto | Deps |
| :--- | :--- | :--- |
| `src/shared/motion/shiny-text.tsx` | Destello lineal sobre el texto (base = `currentColor` del elemento padre) | ninguno |
| `src/shared/motion/gradient-text.tsx` | Degradado accent→ink con pan lento | ninguno |
| `src/shared/motion/marquee.tsx` | Cinta infinita, duplica children (2ª copia `aria-hidden`), pausa en hover/focus | ninguno |
| `src/shared/motion/spotlight-card.tsx` | Glow radial que sigue el puntero (CSS vars `--motion-spot-*`) | hook |
| `src/shared/motion/star-border.tsx` | Dos haces de luz horizontales barriendo el panel (1 accent, ½ ciclo cream) | ninguno |
| `src/shared/motion/count-up.tsx` | Contador rAF con IntersectionObserver; SSR = valor final | IO + rAF |
| `src/shared/motion/reveal.tsx` | Fade-up escalonado al entrar al viewport | IO |
| `src/features/product-catalog/card-hover.tsx` + `card-hover.css` | Spotlight por tarjeta delegado en una isla | hook |

## Aplicación por página

- **`src/pages/index.astro`**: eyebrow "Featured" en `ShinyText`; los 3 claims
  eco envueltos en `Reveal` (stagger 90ms); `CountUp` en el contador de plantas
  por categoría (dato real de Wix `itemCounter`, cero invención); las reseñas
  destacadas entre `SpotlightCard`. `CardHover` en la grilla de productos.
- **`src/pages/products/index.astro`**: eyebrow "Shop" en `ShinyText` +
  `CardHover`.
- **`src/pages/category/[slug].astro`**: `CardHover`.
- **`src/pages/products/[slug].astro`**: "In stock" quedó en texto plano (el
  `ShinyText` se quitó: el barrido sobre texto tracking-widest tan chico lo
  hacía ilegible — pedido del propietario); el bloque de compra
  (`ProductPurchase`) vive en un panel `StarBorder` (rounded-lg border-rule
  bg-paper-warm p-6); las reseñas vuelven a grilla estática (el `Marquee`
  se quitó por legibilidad — pedido del propietario).
- **`src/pages/lookbook.astro`**: h1 del hero en `GradientText`; cada bloque de
  temporada en `Reveal`; `CardHover` para las grillas de producto.
- `product-card.astro` ganó `data-product-media` en el tile de la imagen (gancho
  CSS del glow).

## Gotchas de tipo

- En `.astro`, las props de islas React van con `className` (no `class`): un
  `class` estático tira ts(2322).
- `data-motion="reveal"` en elemento dentro de un `<ul>`: hacer que el hijo
  directo del li sea el `Reveal` (el li conserva la semántica de lista).

## Verificación (hecha, con resultados)

- `npm run check` → **0 errores** (187 archivos).
- `npm test` → **37 archivos / 276 tests en verde** (11 nuevos: 8 en
  `tests/shared/motion/motion.test.tsx` + 2 en
  `tests/features/product-catalog/card-hover.test.tsx`).
- `npx astro build` → ✓ built in ~49s.
- SSR verificado con `wix dev` + curl (HTML real):
  - `/` → 3 `data-motion="count-up"`, 3 `"reveal"`, 1 `"shiny-text"`,
    6 `"spotlight-card"`, y `src/shared/motion/motion.css` +
    `card-hover.css` enlazados.
  - `/products` → `shiny-text` + card-hover.css · `/category/carnivorous` →
    8 `data-product-card` · `/products/cape-sundew` → shiny + star-border +
    marquee (con segunda copia `aria-hidden`) · `/lookbook` → gradient-text,
    2 reveal, 11 product-cards.
- Nota: `astro build` (SSR worker) no emite HTML prerenderizado — la prueba
  honesta del markup fue sobre el dev server, no sobre `dist/`.

## Al terminar

1. Marca el paso 45 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/generate-next-steps` (o el paso que el propietario pida).
