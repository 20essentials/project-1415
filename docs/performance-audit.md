# Performance audit — 2026-10-16 (step 22)

Lighthouse 13.5.0, preset móvil (Moto G Power simulado, 4G lento), Chromium de Playwright.
Categorías: performance, accessibility, best-practices, SEO.

## 1. Rutas auditadas y baseline

**Producción** (`https://petals-d960960gm-0609.wix-site-host.com`, release previo a steps 15/20):

| ruta | perf | a11y | bp | seo | LCP | CLS | TBT | FCP | SI | transfer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 39 | 94 | 96 | 92 | 15.4 s | 0.189 | 444 ms | 3.6 s | 11.1 s | 12.5 MB |
| `/products` | 73 | 100 | 96 | 92 | 4.7 s | 0.005 | 59 ms | 3.1 s | 5.4 s | 578 KB |
| `/products/venus-flytrap-akai-ryu` | 75 | 100 | 96 | 100 | 4.1 s | 0.004 | 33 ms | 3.3 s | 6.4 s | 444 KB |
| `/journal` | 76 | 100 | 96 | 92 | 4.1 s | 0.004 | 26 ms | 3.2 s | 5.6 s | 546 KB |
| `/services`, `/lookbook` | — | — | — | — | — | — | — | — | — | **HTTP 404** |

`/services` y `/lookbook` dan 404 en producción: el release en vivo es anterior a los steps 15 y 20.
No es un hallazgo de performance; se resuelve en el step 23 (build + release).

**Dev** (`astro dev`, 4321) — solo CLS y a11y son representativos (Vite sirve deps sin minificar
y sin HTTPS, así que LCP/TBT/SI/bp/seo no lo son): `/` 20 / 95 / 77 / 85 con CLS 0.184 y
`button-name` en fallo; `/products` 44; `/products/[slug]` 27.

## 2. Hallazgos y acciones

### 2.1 CLS del home = 0.189 (bucket "poor") — corregido

Mismo valor exacto en producción (0.189) y en dev (0.1844) → causa estructural, no del entorno.
El elemento `[data-world]` (scroll-world) está vacío en el primer paint; el motor le fija la
altura del track recién al hidratar (`.sw-track` → `13.4 × innerHeight ≈ 12060 px`), lo que empuja
todo el contenido de abajo (el `ul` de destacados, `score 0.184`).

- `src/features/home/scroll-world.astro`: script `is:inline` **después** del config JSON que
  reserva `min-height` antes del paint con el mismo cálculo de segmentos (dive + connector + 1vh).
- `src/features/home/scroll-world.js`: `layout()` sincroniza `container.style.minHeight` con la
  altura del track (cubre resize/rotación).

Verificado: reserva pre-paint `12060 px` == altura final del track `12060 px` (delta 0 px → no hay
salto al montar) y CLS dev `0.184 → 0` en `/`. `products` y `pdp` también bajaron a 0.

### 2.2 `button-name` (a11y home 94) — corregido

En móvil `.sw-route__label` es `display:none`, así que los 7 dots del scroll-world quedaban sin
nombre accesible. `scroll-world.js` ahora les pone `aria-label` (label traducido del stop, con
fallback a título/índice). a11y dev `95 → 100`, `button-name` FAIL → OK.

### 2.3 Fuentes: Google Fonts render-blocking + fuentes locales muertas — corregido

`src/app/layout.astro` cargaba Google Fonts (1 stylesheet de terceros + 2 preconnects) mientras
`src/styles/fonts.css` (self-host con `font-display: swap` y `unicode-range`) y
`public/fonts/{fraunces,inter}-latin.woff2` (115 KB) no se importaban desde ningún lado.

- `global.css`: `@import "./fonts.css"`.
- `layout.astro`: fuera preconnects + stylesheet de Google; `<link rel="preload">` de los dos woff2.

**Paridad verificada por métricas** (producción con Google Fonts vs dev con las locales, mismo texto
y tamaño): `h1` Fraunces 48px → 205.8 px en ambas; títulos de tarjeta Inter 18px → 197 / 149.4 /
113.7 px; párrafo Inter 14px → 563 px; link "Care" 14px → 31.3 px. Cero requests a
`fonts.googleapis.com`/`fonts.gstatic.com` en dev. (No hubo comparación pixel a pixel: el modelo de
esta sesión no lee imágenes; la paridad se sostiene en las métricas tipográficas.)

### 2.4 Imágenes — endurecido

15 `<img>` en el repo, **0** con `decoding="async"` → añadido a los 15.
`fetchpriority="high"` en los above-fold: hero de `/lookbook`, featured de `/journal`, cover de
`/journal/[slug]`, hero de `/gift-cards` y la imagen principal del PDP (antes condicionada a
`alt !== ''`; ahora siempre, es el LCP de la página).

`product-card.astro`: `srcset` 400w/640w + prop opcional `sizes` (default conservador), que las
páginas pasan según su grilla (home/lookbook 2→3/4 col, catálogo 1→2→3→4 col, related del PDP).
En móvil el catálogo a 1 columna sigue pidiendo 640w y el home/lookbook a 2 columnas pasan a 400w.

Ya estaban bien: `width`/`height` en las 15, `loading="lazy"` en las below-fold y `alt` en todas
(`image-alt` sin fallos en las 6 rutas). `cart-view.tsx` tenía un `<img>` sin dimensiones → 80×80.

### 2.5 Islands — revisado

- `CartBadge` estaba `client:only="react"` en **todas** las páginas: el link del carrito aparecía
  recién tras hidratar (pop-in en el header y dependencia de JS para un link de navegación).
  Ahora `client:idle` (SSR del link, verificado en el HTML servido y en el bundle del worker) con
  init determinista (`useState(0)`; el conteo cacheado de sessionStorage se lee en el efecto) para
  no desincronizar la hidratación.
- Se mantienen: `CartView`/`ContactForm`/`GiftCardPurchase`/`ProductPurchase`/`WorkshopBooking`
  `client:load` (widget interactivo principal de su página) y `NewsletterForm` `client:idle`.

### 2.6 Tailwind — canónicas

`language-selector.astro`: `top-[calc(100%+0.5rem)]` → `top-full mt-2`. Geometría idéntica medida
con Playwright (gap 14.9 px, `left`/`right`/`width` iguales antes y después del cambio).
`aria-[current=true]` se conserva: Tailwind v4 no expone utilidad canónica `aria-current`.

### 2.7 Vídeos del scroll-world — tradeoff aceptado

`public/videos` = 53 MB (5 clips, 8–14.5 MB). El hero descarga `v1.mp4` (10 MB) al cargar y el resto
progresivamente al hacer scroll: es el diseño del scroll-scrub y el mayor costo de transferencia del
home (12.5 MB en el baseline, con `inicio.webp` 398 KB + el resto de stills ~1.5 MB). No se
re-encodea: perdería la calidad del scrub y obliga a regenerar los clips.

### 2.8 404 de `carts/current` — aceptado

`https://edge.wixapis.com/ecom/v1/carts/current` devuelve 404 (carrito anónimo vacío) en todas las
rutas y es el único fallo de `errors-in-console` (bp 96). Es un log del navegador del fetch del
carrito; no se puede suprimir desde la app.

### 2.9 Bundle de producción — sano, sin cambios

`dist/_astro` = 457 KB en 29 archivos (mayor: runtime React `client.*.js` 136.5 KB,
`setup.*.js` 66 KB, `site-search` 33.5 KB, `wix-image` 18.4 KB, `scroll-world` 18 KB) + CSS único
de 56 KB. No se aplicó purga ni split adicional. Sin clases arbitrarias Tailwind no canónicas
restantes (`grep` sobre `src`).

## 3. Verificación ejecutada

| check | resultado |
| --- | --- |
| `npm run check` (`astro check`) | 0 errores (93 files; 8 hints preexistentes) |
| `npm test` | 44/44 |
| `npm run test:e2e` | 9/9 |
| `npx @wix/cli@latest build` | verde (`@font-face` local en el CSS del bundle, woff2 en `dist/fonts`, script de reserva presente en el HTML del worker) |
| Lighthouse dev post-fix | `/` a11y 100 + CLS 0; `/products` y `/products/[slug]` CLS 0 |
| Reserva pre-paint vs track | 12060 px == 12060 px (delta 0) |
| Paridad de fuentes | anchos de texto idénticos vs producción con Google Fonts |

## 4. Pendiente / no verificado

- **Métricas de producción post-fix**: las que importan (LCP, TBT, SI, transfer) no son medibles en
  dev ni sirviendo `dist/` local (el build es un worker SSR de Wix/Cloudflare). Se capturan después
  del release del step 23; el baseline de producción de este doc es el punto de comparación.
- **Regresión visual**: verificada por métricas tipográficas y de layout (fuentes, geometría del
  menú de idioma, reserva del scroll-world) y por e2e, no por inspección de imágenes.
- Sin redimensión/cambio de formato masivo de imágenes (Wix ya sirve AVIF/WebP por `Accept`) ni
  purga de CSS (riesgo alto, beneficio marginal).
